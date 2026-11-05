import path from 'path';
import { toAnchor } from '../../../helpers/toAnchor';
import { SEE_ALSO_LABEL } from '../../constants';
import { TInlineContext } from '../../types';
import { isImagePath, toAssetUrl } from '../assets';
import { resolveNote } from '../vaultIndex';

const WIKILINK_PATTERN = /(!?)\[\[([^\]\n]+?)\]\]/g;
const CODE_SPAN_PATTERN = /(`+)[\s\S]*?\1/g;
const BASE64_IMAGE_PATTERN = /!\[[^\]]*\]\(\s*<?data:image\//;
const IMAGE_SIZE_PATTERN = /^\d+(x\d+)?$/;

type TWikilink = {
  target: string;
  heading: string;
  alias: string;
};

const parseWikilink = (inner: string): TWikilink => {
  const [rawTarget, ...aliasParts] = inner.split(/\\?\|/);
  const hashIndex = rawTarget.indexOf('#');
  const target = (hashIndex === -1 ? rawTarget : rawTarget.slice(0, hashIndex)).replace(/\\$/, '').trim();
  const heading = hashIndex === -1 ? '' : rawTarget.slice(hashIndex + 1).trim();

  return { target, heading, alias: aliasParts.join('|').trim() };
};

const escapeLabel = (label: string): string => label.replace(/([[\]])/g, '\\$1');

/**
 * Применяет преобразование к тексту вне inline-кода, чтобы не трогать примеры синтаксиса.
 *
 * @param text - Markdown-фрагмент
 * @param transform - Преобразование обычного текста
 * @returns Фрагмент с нетронутыми code span
 */
export const mapOutsideCodeSpans = (text: string, transform: (part: string) => string): string => {
  let result = '';
  let lastIndex = 0;

  for (const match of text.matchAll(CODE_SPAN_PATTERN)) {
    const index = match.index ?? 0;

    result += transform(text.slice(lastIndex, index)) + match[0];
    lastIndex = index + match[0].length;
  }

  return result + transform(text.slice(lastIndex));
};

const renderEmbed = ({ target, alias }: TWikilink, context: TInlineContext): string => {
  if (isImagePath(target)) {
    const key = target.toLowerCase();
    const assetPath = context.assets.get(key) ?? context.assets.get(path.posix.basename(key));

    if (!assetPath) {
      context.warn('unresolved-embed', target);

      return '';
    }

    const alt = alias && !IMAGE_SIZE_PATTERN.test(alias) ? escapeLabel(alias) : '';

    return `![${alt}](${toAssetUrl(assetPath, context.assetsBaseUrl)})`;
  }

  const entry = resolveNote(target, context);

  if (!entry) {
    context.warn('unresolved-embed', target);

    return '';
  }

  return `${SEE_ALSO_LABEL}: [${escapeLabel(entry.title)}](${entry.href})`;
};

const renderLink = ({ target, heading, alias }: TWikilink, context: TInlineContext): string => {
  const label = alias || heading || path.posix.basename(target);
  const hash = heading ? `#${toAnchor(heading)}` : '';

  if (!target) return heading ? `[${escapeLabel(label)}](${hash})` : label;

  const entry = resolveNote(target, context);

  if (!entry) {
    context.warn('unresolved-link', target);

    return label;
  }

  return `[${escapeLabel(label)}](${entry.href}${hash})`;
};

/**
 * Переводит Obsidian-синтаксис фрагмента в CommonMark.
 *
 * @description
 * - `[[note|label]]` → ссылка на материал сайта, неразрешённая — просто подпись
 * - `![[img.png|350]]` → картинка с адреса Quartz, `![[note]]` → «См. также»
 * - base64-картинки остаются, но попадают в предупреждения
 *
 * @param text - Markdown-фрагмент
 * @param context - Индексы vault и картинок, сборщик предупреждений
 * @returns Фрагмент без wikilink
 */
export const transformInline = (text: string, context: TInlineContext): string =>
  mapOutsideCodeSpans(text, (part) => {
    if (BASE64_IMAGE_PATTERN.test(part)) context.warn('base64-image', '');

    return part.replace(WIKILINK_PATTERN, (_match, bang: string, inner: string) => {
      const wikilink = parseWikilink(inner);

      return bang ? renderEmbed(wikilink, context) : renderLink(wikilink, context);
    });
  });
