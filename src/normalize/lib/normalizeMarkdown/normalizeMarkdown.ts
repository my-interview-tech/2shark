import { marked, Token, Tokens } from 'marked';
import { toAnchor } from '../../../helpers/toAnchor';
import { TTocItem } from '../../../types';
import { BACK_LINK_LABEL, PAYWALL_SENTINEL, RESERVED_ANCHORS } from '../../constants';
import { TMarkdownContext, TNormalizedMarkdown } from '../../types';
import { transformInline } from '../transformInline';

const FENCE_OPEN_PATTERN = /^\s*(`{3,}|~{3,})/;
const PAYWALL_MARKER_PATTERN = /%%\s*paywall\s*%%/i;
const COMMENT_PATTERN = /[ \t]*%%[\s\S]*?%%/g;
const ANCHOR_SUFFIX_PATTERN = /\s*\{#([^}]+)\}\s*$/;
const BACK_LINK_PATTERN = new RegExp(`^\\s*(\\[\\[[^\\]]*\\|\\s*${BACK_LINK_LABEL}\\s*\\]\\]\\s*)+$`);
const NUMBER_PREFIX_PATTERN = /^\d+\s+/;
const TOC_DEPTH = 2;
const MAX_ANCHORED_DEPTH = 3;

type TPart = {
  md: string;
  token: Token;
};

/**
 * Применяет преобразование к строкам вне fenced-блоков кода.
 *
 * @param source - Markdown
 * @param transform - Преобразование фрагмента между блоками кода
 * @returns Markdown с нетронутыми блоками кода
 */
export const mapOutsideFences = (source: string, transform: (chunk: string) => string): string => {
  const output: string[] = [];
  let buffer: string[] = [];
  let fence: string | null = null;

  const flush = (): void => {
    if (!buffer.length) return;

    output.push(transform(buffer.join('\n')));
    buffer = [];
  };

  for (const line of source.split('\n')) {
    const match = line.match(FENCE_OPEN_PATTERN);

    if (fence) {
      output.push(line);

      const isClosing = match && match[1][0] === fence[0] && match[1].length >= fence.length && !line.trim().slice(match[1].length).trim();

      if (isClosing) fence = null;

      continue;
    }

    if (match) {
      flush();
      fence = match[1];
      output.push(line);

      continue;
    }

    buffer.push(line);
  }

  flush();

  return output.join('\n');
};

/**
 * Убирает inline-разметку из заголовка для подписи в оглавлении.
 *
 * @param text - Текст заголовка в markdown
 * @returns Обычный текст
 */
export const toPlainText = (text: string): string =>
  text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\\([[\]])/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/(\*\*|__|~~|`|\*)/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const toComparable = (text: string): string =>
  text.replace(NUMBER_PREFIX_PATTERN, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');

const createAnchorRegistry = () => {
  const used = new Set<string>(RESERVED_ANCHORS);

  return (base: string): string => {
    let anchor = base;
    let counter = 2;

    while (used.has(anchor)) {
      anchor = `${base}-${counter}`;
      counter += 1;
    }

    used.add(anchor);

    return anchor;
  };
};

const joinParts = (parts: TPart[]): string =>
  parts
    .filter((part) => part.token.type !== 'space')
    .map((part) => part.md.replace(/\s+$/, ''))
    .filter(Boolean)
    .join('\n\n');

const isBlank = (part: TPart): boolean => part.token.type === 'space' || part.token.type === 'hr' || !part.md.trim();

const trimTrailing = (parts: TPart[]): TPart[] => {
  const result = [...parts];

  while (result.length && isBlank(result[result.length - 1])) result.pop();

  return result;
};

const hasText = (part: TPart): boolean =>
  part.token.type === 'paragraph' && Boolean(toPlainText(part.md));

const isContentBlock = (part: TPart): boolean => part.token.type !== 'heading' && !isBlank(part);

/**
 * Превью без маркера `%% paywall %%`: первый абзац с текстом и заголовок прямо над ним.
 * Без абзацев — первый блок любого типа. Блок берётся целиком, чтобы не разорвать ссылку, список или код.
 */
const buildDefaultPreview = (parts: TPart[]): string => {
  const textIndex = parts.findIndex(hasText);
  const paragraphIndex = textIndex === -1 ? parts.findIndex(isContentBlock) : textIndex;

  if (paragraphIndex === -1) return '';

  const previous = parts.slice(0, paragraphIndex).filter((part) => part.token.type !== 'space');
  const heading = previous[previous.length - 1];
  const selected = heading?.token.type === 'heading' ? [heading, parts[paragraphIndex]] : [parts[paragraphIndex]];

  return joinParts(selected);
};

/**
 * Приводит Obsidian-заметку к CommonMark для экрана статьи.
 *
 * @description
 * - комментарии `%%...%%` вырезаются; `%% paywall %%` делит текст на превью и закрытую часть
 * - wikilink и embeds переводятся в ссылки и картинки сайта
 * - ведущий H1, совпадающий с title, удаляется, остальные H1 становятся H2
 * - H2 и H3 получают якорь `{#id}` без дублей, оглавление строится из H2
 * - абзацы из одних ссылок «Назад» и хвостовые `---` удаляются
 *
 * @param source - Тело заметки без frontmatter
 * @param context - Индексы vault и картинок, title материала и сборщик предупреждений
 * @returns Полный markdown, превью и оглавление
 */
export const normalizeMarkdown = (source: string, context: TMarkdownContext): TNormalizedMarkdown => {
  const prepared = mapOutsideFences(source, (chunk) =>
    chunk.replace(PAYWALL_MARKER_PATTERN, `\n\n${PAYWALL_SENTINEL}\n\n`).replace(COMMENT_PATTERN, ''),
  );
  const tokens = marked.lexer(prepared);
  const registerAnchor = createAnchorRegistry();
  const toc: TTocItem[] = [];
  const parts: TPart[] = [];
  let paywallIndex = -1;
  let hasContent = false;

  for (const token of tokens) {
    if (token.type === 'html' && token.raw.trim() === PAYWALL_SENTINEL) {
      if (paywallIndex === -1) paywallIndex = parts.length;

      continue;
    }

    if (token.type === 'paragraph' && BACK_LINK_PATTERN.test(token.raw)) continue;

    if (token.type === 'heading') {
      const heading = token as Tokens.Heading;
      const explicitAnchor = heading.text.match(ANCHOR_SUFFIX_PATTERN)?.[1];
      const text = transformInline(heading.text.replace(ANCHOR_SUFFIX_PATTERN, ''), context).trim();
      const label = toPlainText(text);

      if (heading.depth === 1 && !hasContent && toComparable(label) === toComparable(context.title)) continue;

      const depth = Math.max(heading.depth, TOC_DEPTH);

      hasContent = true;

      if (depth > MAX_ANCHORED_DEPTH) {
        parts.push({ md: `${'#'.repeat(depth)} ${text}\n\n`, token });

        continue;
      }

      const anchor = registerAnchor(explicitAnchor ?? toAnchor(label));

      if (depth === TOC_DEPTH) toc.push({ id: anchor, label });

      parts.push({ md: `${'#'.repeat(depth)} ${text} {#${anchor}}\n\n`, token });

      continue;
    }

    if (token.type === 'space' || token.type === 'hr' || token.type === 'code' || token.type === 'html') {
      parts.push({ md: token.raw, token });
      hasContent = hasContent || token.type !== 'space';

      continue;
    }

    const md = transformInline(token.raw, context);

    if (!md.trim()) continue;

    hasContent = true;
    parts.push({ md, token });
  }

  const contentParts = trimTrailing(parts);
  const previewMd =
    paywallIndex === -1 ? buildDefaultPreview(contentParts) : joinParts(trimTrailing(parts.slice(0, paywallIndex)));

  return {
    contentMd: joinParts(contentParts),
    previewMd,
    toc,
  };
};
