const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ё: 'e',
  ж: 'zh',
  з: 'z',
  и: 'i',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'h',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'sch',
  ъ: '',
  ы: 'y',
  ь: '',
  э: 'e',
  ю: 'yu',
  я: 'ya',
};

const MAX_ANCHOR_LENGTH = 80;

/**
 * Превращает заголовок в якорь адреса: транслитерация кириллицы, латиница, цифры и дефисы.
 *
 * @param text - Заголовок
 * @param fallback - Якорь, если в заголовке не осталось допустимых символов
 * @returns Якорь вида `chto-takoe-doctype`
 *
 * @example
 * ```typescript
 * toAnchor('Что такое DOCTYPE?'); // 'chto-takoe-doctype'
 * ```
 */
export const toAnchor = (text: string, fallback: string = 'section'): string => {
  const anchor = Array.from(text.toLowerCase())
    .map((char) => CYRILLIC_TO_LATIN[char] ?? char)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_ANCHOR_LENGTH)
    .replace(/-+$/g, '');

  return anchor || fallback;
};

/**
 * Публичный слаг технологии для адреса `/topics/<slug>`.
 *
 * Технология без `slug` в YAML (служебные `index.md`, `Навигация`) на сайт не попадает.
 *
 * @param slug - `slug` из `category-mapping.yaml`
 * @returns Слаг или null
 */
export const getPublicSlug = (slug?: string): string | null => slug?.trim() || null;
