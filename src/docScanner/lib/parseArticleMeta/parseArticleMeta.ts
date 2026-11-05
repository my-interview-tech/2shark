import { toAnchor } from '../../../helpers/toAnchor';
import { ChapterMapping, TArticleContext, TArticleKind, TChapterConfig } from '../../../types';

export const ARTICLE_KINDS: readonly TArticleKind[] = ['article', 'question', 'quiz', 'task'];

/** Секция для материалов без chapter во frontmatter. */
export const DEFAULT_CHAPTER: TChapterConfig = { title: 'Материалы', anchor: 'materials', order: 999 };

const LEVEL_MIN = 1;
const LEVEL_MAX = 3;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const toText = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() ? value.trim() : undefined;

/**
 * Возвращает тип материала, если значение из списка допустимых.
 *
 * @param value - `kind` из frontmatter или YAML
 * @returns Тип материала или null
 */
export const parseKind = (value: unknown): TArticleKind | null =>
  ARTICLE_KINDS.find((kind) => kind === value) ?? null;

/**
 * Возвращает уровень сложности или важности.
 *
 * @param value - `complexity` или `importance` из frontmatter
 * @returns Целое 1..3 или null
 */
export const parseLevel = (value: unknown): number | null => {
  if (typeof value !== 'number' || !Number.isInteger(value)) return null;

  return value >= LEVEL_MIN && value <= LEVEL_MAX ? value : null;
};

/**
 * Возвращает блок «Зачем» без пустых и посторонних полей.
 *
 * @param value - `context` из frontmatter
 * @returns Контекст или null, если в нём ничего нет
 */
export const parseContext = (value: unknown): TArticleContext | null => {
  if (!isRecord(value)) return null;

  const context: TArticleContext = {};
  const caption = toText(value.caption);
  const interview = toText(value.interview);
  const result = Array.isArray(value.result)
    ? value.result.map(toText).filter((item): item is string => Boolean(item))
    : [];

  if (caption) context.caption = caption;
  if (interview) context.interview = interview;
  if (result.length) context.result = result;

  return Object.keys(context).length ? context : null;
};

type TResolveChapterParams = {
  chapter: unknown;
  technologyChapters?: ChapterMapping;
  chapterMapping?: ChapterMapping;
};

/**
 * Находит секцию экрана технологии для chapter из frontmatter.
 *
 * Переопределение технологии важнее общего `chapters.yaml`. Неизвестный chapter
 * становится отдельной секцией в конце списка, пустой — секцией «Материалы».
 *
 * @param params - chapter и маппинги разделов
 * @returns Конфиг секции
 */
export const resolveChapter = ({
  chapter,
  technologyChapters,
  chapterMapping,
}: TResolveChapterParams): TChapterConfig => {
  const name = toText(chapter);

  if (!name) return DEFAULT_CHAPTER;

  const config = technologyChapters?.[name] ?? chapterMapping?.[name];

  if (config) return config;

  return { title: name, anchor: toAnchor(name, DEFAULT_CHAPTER.anchor), order: DEFAULT_CHAPTER.order };
};
