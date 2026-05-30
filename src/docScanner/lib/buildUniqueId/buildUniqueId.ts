import path from "path";
import { slugify } from "../slugify";

/**
 * Собирает детерминированный уникальный идентификатор документа на основе пути и имени файла.
 *
 * Правила формирования:
 * - Каждый сегмент `cleanPathParts` и basename файла (без `.md`) нормализуются через `slugify`
 * - Префикс ID = `<slug(cleanPathParts.join('-'))>-<slug(fileName)>`
 * - Для гарантии уникальности добавляется хеш с опцией `{ addHash: true }`
 *
 * Примеры:
 * - cleanPathParts: ["react","hooks"], filePath: "/cwd/docs/react/hooks.md"
 *   → `react-hooks-hooks-<hash>`
 * - cleanPathParts: [], filePath: "/cwd/Guide.md"
 *   → `guide-<hash>`
 */
export function buildUniqueId(cleanPathParts: string[], filePath: string): string {
    const fileName = path.basename(filePath, '.md');
    const fileSlug = slugify(fileName);
    const pathSlug = cleanPathParts.map((part) => slugify(part)).join('-');
    const uniqueId = `${pathSlug}-${fileSlug}`;

    // Важно: сохраняем текущую сигнатуру вызова для совместимости с тестами (второй и третий аргументы игнорируются в моках)
    return slugify(uniqueId, 'default', { addHash: true });
}
