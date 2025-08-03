import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import { slugify } from '../slugify';
import { validateLinks } from '../validateLinks';
import { calculateFileHash } from '../fileHash/fileHash';
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

    // TODO: рефакторинг, все что далее вызывает вопросы и инициирует ошибки

    const relativePath = path.relative(process.cwd(), filePath);
    const pathParts = relativePath.split(path.sep);

    // Убираем 'docs' из пути если он есть
    const cleanPathParts = pathParts[0] === 'docs' ? pathParts.slice(1) : pathParts;

    // Получаем название папки (первый уровень после docs)
    const folderName = cleanPathParts[0] || 'docs';

    // Убираем префикс с номером (например, "001 Frontend" -> "Frontend")
    const technology = folderName.replace(/^\d+\s+/, '');

    // Ищем маппинг для этой технологии
    const mapping = technologyMapping[technology];

    if (!mapping) {
      // console.log(`Пропускаем файл ${filePath}: технология "${technology}" не найдена в конфиге`);
      return null;
    }

    const finalSpecialty = mapping.specialty;
    const priority = mapping.priority || 0;
    const description = mapping.description || '';

    // Определяем специальность
    let specialty: string;
    if (Array.isArray(finalSpecialty)) {
      specialty = finalSpecialty[0];
    } else if (typeof finalSpecialty === 'string' && finalSpecialty.includes(',')) {
      specialty = finalSpecialty.split(',')[0].trim();
    } else {
      specialty = finalSpecialty;
    }

    // Проверяем, что специальность существует в конфиге специальностей
    if (specialtyMapping && !specialtyMapping[specialty]) {
      console.log(`Пропускаем файл ${filePath}: специальность "${specialty}" не найдена в конфиге специальностей`);
      return null;
    }

    return {
      id: slugify(path.basename(filePath, '.md')),
      title: data?.title || path.basename(filePath, '.md'),
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
