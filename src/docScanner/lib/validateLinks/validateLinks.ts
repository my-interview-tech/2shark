/**
 * Валидирует ссылки из метаданных info
 *
 * Принимает массив ссылок из frontmatter info и возвращает
 * только валидные внешние ссылки (исключая ссылки на md файлы).
 *
 * @param info - Массив ссылок из frontmatter
 * @returns Массив валидированных внешних ссылок
 *
 * @example
 * ```typescript
 *
 * const links = [
 *   "[[062 Событийный цикл. Микрозадачи и макрозадачи|Событийный цикл? Микрозадачи и макрозадачи]]",
 *   "https://habr.com/ru/post/461401/",
 *   "[[071 Объяснение работы EventLoop в JavaScript|Объяснение работы EventLoop в JavaScript]]"
 * ];
 *
 * const validLinks = validateLinks(links);
 * // Результат: ["https://habr.com/ru/post/461401/"]
 * ```
 */
export function validateLinks(info: string[] | undefined): string[] {
  if (!info || !Array.isArray(info)) {
    return [];
  }

  return info.filter((link) => {
    const trimmedLink = link.trim();

    if (!trimmedLink) {
      return false;
    }

    if (trimmedLink.startsWith('[[')) {
      return false;
    }

    try {
      const url = new URL(trimmedLink);

      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  });
}
