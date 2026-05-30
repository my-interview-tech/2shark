import path from 'path';

/**
 * Возвращает массив сегментов относительного пути к файлу без корневого префикса `docs`.
 *
 * Примеры:
 * - abs: /cwd/docs/react/hooks.md  → rel: docs/react/hooks.md → ["react","hooks.md"]
 * - abs: /cwd/react/hooks.md       → rel: react/hooks.md       → ["react","hooks.md"]
 * - abs: /cwd/src/docs/a/b.md      → rel: src/docs/a/b.md      → ["src","docs","a","b.md"] (docs не первый сегмент)
 *
 * @param filePath Полный путь к файлу
 * @returns Сегменты относительного пути, где ведущий `docs` удалён, если он первый
 */
export function getCleanPathParts(filePath: string): string[] {
    const relativePath = path.relative(process.cwd(), filePath);
    const pathParts = relativePath.split(path.sep);

    return pathParts[0] === 'docs' ? pathParts.slice(1) : pathParts;
}
