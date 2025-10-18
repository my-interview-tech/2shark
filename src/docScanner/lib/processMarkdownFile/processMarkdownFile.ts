import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import { buildUniqueId } from '../buildUniqueId';
import { validateLinks } from '../validateLinks';
import { calculateFileHash } from '../fileHash';
import { getCleanPathParts } from '../getCleanPathParts';
import { extractTechnology } from '../extractTechnology';
import { normalizeSpecialty } from '../normalizeSpecialty';
import { DocItem } from '../../../types';
import { TProcessMarkdownFileParams } from './types';

/**
 * Обрабатывает отдельный Markdown файл и извлекает метаданные
 *
 * @param params - Параметры для обработки файла
 * @param params.filePath - Полный путь к Markdown файлу
 * @param params.technologyMapping - Объект маппинга категорий (технологии)
 * @param params.specialtyMapping - Объект маппинга специальностей
 * @returns Promise с обработанным документом или null если произошла ошибка
 *
 * @example
 * ```typescript
 * const item = await processMarkdownFile('./docs/react/hooks.md', technologyMapping, specialtyMapping);
 *
 * if (item) {
 *   console.log(`Обработан: ${item.title}`);
 * }
 * ```
 */
export async function processMarkdownFile({
  filePath,
  technologyMapping,
  specialtyMapping,
}: TProcessMarkdownFileParams): Promise<DocItem | DocItem[] | null> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const { data, content: markdownContent } = matter(content);

    if (data?.draft === true) {
      console.log(`Пропускаем файл ${filePath}: draft: true`);

      return null;
    }

    const cleanPathParts = getCleanPathParts(filePath);
    const technology = extractTechnology(cleanPathParts);

    const mapping = technologyMapping[technology];

    if (!mapping) return null;

    const { specialty: specialtyConfig, priority = 0, description = '' } = mapping as any;

    const specialty = normalizeSpecialty(specialtyConfig);

    if (specialtyMapping && !specialtyMapping[specialty]) {
      console.log(
        `Пропускаем файл ${filePath}: специальность "${specialty}" не найдена в конфиге специальностей`,
      );

      return null;
    }

    const finalId = buildUniqueId(cleanPathParts, filePath);
    const title = data?.title || path.basename(filePath, '.md');

    return {
      id: finalId,
      title,
      content: markdownContent,
      specialty,
      technology,
      priority,
      description,
      tags: data?.tags || [],
      info: validateLinks(data?.info),
      file_hash: calculateFileHash(content),
      created_at: new Date(),
      updated_at: new Date(),
    };
  } catch (error) {
    console.error(`Ошибка обработки файла ${filePath}:`, error);

    return null;
  }
}
