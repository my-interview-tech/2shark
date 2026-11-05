import { TArticleLink } from '../../../types';

/**
 * Проверяет, что строка — абсолютная http(s)-ссылка, а не wikilink.
 *
 * @param value - Кандидат в ссылку
 * @returns Обрезанная ссылка или null
 */
const toExternalUrl = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();

  if (!trimmed || trimmed.startsWith('[[')) return null;

  try {
    const url = new URL(trimmed);

    return url.protocol === 'http:' || url.protocol === 'https:' ? trimmed : null;
  } catch {
    return null;
  }
};

const toOptionalText = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

/**
 * Разбирает `info` из frontmatter в ссылки с подписью и картинкой.
 *
 * Элемент — строка-адрес или объект `{ url, title?, image? }`. Wikilink, не-http(s)
 * адреса и дубли отбрасываются, порядок сохраняется.
 *
 * @param info - Значение `info` из frontmatter
 * @returns Внешние ссылки в порядке frontmatter
 */
export const parseLinks = (info: unknown): TArticleLink[] => {
  if (!Array.isArray(info) || !info.length) return [];

  const seen = new Set<string>();
  const links: TArticleLink[] = [];

  for (const item of info) {
    const isObject = typeof item === 'object' && item !== null;
    const record = isObject ? (item as Record<string, unknown>) : null;
    const url = toExternalUrl(record ? record.url : item);

    if (!url || seen.has(url)) continue;

    seen.add(url);
    links.push({
      url,
      title: record ? toOptionalText(record.title) : null,
      image: record ? toExternalUrl(record.image) : null,
    });
  }

  return links;
};

/**
 * Валидирует ссылки из метаданных info
 *
 * Принимает массив ссылок из frontmatter info и возвращает
 * только валидные внешние ссылки (исключая ссылки на md файлы).
 *
 * @param info - Массив ссылок из frontmatter
 * @returns Массив валидированных внешних ссылок
 */
export const validateLinks = (info: unknown): string[] => parseLinks(info).map((link) => link.url);
