/**
 * Извлекает название технологии из сегментов пути.
 *
 * Берёт первый сегмент массива `cleanPathParts` и удаляет ведущий числовой
 * префикс с пробелом (например, "001 Frontend" → "Frontend"). Если массив
 * пустой, возвращает `docs`.
 *
 * Примеры:
 * - ["react", "hooks.md"] → "react"
 * - ["001 Frontend", "guide.md"] → "Frontend"
 * - [] → "docs"
 *
 * Примечание: строки вида "001-Frontend" не изменяются (нет пробела после числа).
 */
export function extractTechnology(cleanPathParts: string[]): string {
    const folderName = cleanPathParts[0] || 'docs';

    return folderName.replace(/^\d+\s+/, '');
}