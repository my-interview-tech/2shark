/**
 * Преобразует текст в URL-friendly slug
 *
 * @param text - Исходный текст для преобразования
 * @param fallback - Значение по умолчанию если результат пустой
 * @returns URL-friendly строка
 *
 * @example
 * ```typescript
 * slugify('React Hooks Guide'); // 'react-hooks-guide'
 * slugify(''); // 'default'
 * ```
 */
export function slugify(text: string, fallback: string = 'default'): string {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || fallback
  );
}
