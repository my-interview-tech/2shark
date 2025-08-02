import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import { slugify } from '../slugify';
import { DocItem, CategoryMapping } from '../../../types';

/**
 * Обрабатывает отдельный Markdown файл и извлекает метаданные
 *
 * @param filePath - Полный путь к Markdown файлу
 * @param categoryMapping - Объект маппинга категорий
 * @returns Promise с обработанным документом или null если произошла ошибка
 *
 * @example
 * ```typescript
 * const item = await processMarkdownFile('./docs/react/hooks.md', categoryMapping);
 * if (item) {
 *   console.log(`Обработан: ${item.title}`);
 * }
 * ```
 */
export async function processMarkdownFile(filePath: string, categoryMapping: CategoryMapping): Promise<DocItem | null> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const { data, content: markdownContent } = matter(content);

    const relativePath = path.relative(process.cwd(), filePath);
    const specialty = path.dirname(relativePath).split(path.sep)[0];
    const technology = path.dirname(relativePath).split(path.sep)[1] || specialty;

    const mapping = categoryMapping[technology];
    const finalSpecialty = mapping?.specialty || specialty;
    const priority = mapping?.priority || 0;
    const description = mapping?.description || '';

    return {
      id: slugify(path.basename(filePath, '.md')),
      title: data?.title || path.basename(filePath, '.md'),
      content: markdownContent,
      specialty: Array.isArray(finalSpecialty) ? finalSpecialty[0] : finalSpecialty,
      technology,
      priority,
      description,
      tags: data?.tags || [],
      created_at: new Date(),
      updated_at: new Date(),
    };
  } catch (error) {
    console.error(`Ошибка обработки файла ${filePath}:`, error);
    return null;
  }
}
