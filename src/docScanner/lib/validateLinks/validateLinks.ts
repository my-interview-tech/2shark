/**
 * Валидирует ссылки из метаданных info
 *
 * Принимает массив ссылок из frontmatter info и возвращает
 * только валидные внешние ссылки (исключая ссылки на md файлы).
 *
 * @param info - Массив ссылок из frontmatter
 * @returns Массив валидированных внешних ссылок
 */
export const validateLinks = (info: string[] | undefined): string[] => {
  if (!Array.isArray(info) || !info.length) return [];

  return info.filter((link) => {
    const trimmed = link.trim();
  
    if (!trimmed || trimmed.startsWith('[[')) return false;

    try {
      const url = new URL(trimmed);

      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  });
}
