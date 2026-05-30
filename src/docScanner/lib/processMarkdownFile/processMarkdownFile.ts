import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import { validateLinks } from '../validateLinks';
import { calculateFileHash } from '../fileHash';
import { getCleanPathParts } from '../getCleanPathParts';
import { extractTechnology } from '../extractTechnology';
import { normalizeSpecialty } from '../normalizeSpecialty';
import { DocItem } from '../../../types';
import { TProcessMarkdownContentParams, TProcessMarkdownFileParams } from './types';

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
    return processMarkdownContent({
      filePath,
      content,
      technologyMapping,
      specialtyMapping,
    });
  } catch (error) {
    console.error(`Ошибка обработки файла ${filePath}:`, error);

    return null;
  }
}

export function processMarkdownContent({
  filePath,
  content,
  technologyMapping,
  specialtyMapping,
  revisionMetadata,
}: TProcessMarkdownContentParams): DocItem | null {
  try {
    const { data, content: markdownContent } = matter(content);

    if (data?.draft === true) {
      console.log(`Пропускаем файл ${filePath}: draft: true`);

      return null;
    }

    const uid = typeof data?.uid === 'string' ? data.uid.trim() : '';

    if (!uid) {
      console.error(`Ошибка валидации файла ${filePath}: отсутствует обязательное поле uid`);

      return null;
    }

    const cleanPathParts = getCleanPathParts(filePath);
    const technologyFromPath = extractTechnology(cleanPathParts);
    const technology = typeof data?.technology === 'string' ? data.technology.trim() : technologyFromPath;

    const mapping = technologyMapping[technology];

    if (!mapping) {
      console.error(`Ошибка валидации файла ${filePath}: технология "${technology}" не найдена в mapping`);

      return null;
    }

    const specialtyFromFrontmatter = typeof data?.specialty === 'string' ? data.specialty.trim() : '';
    const specialtyConfig = specialtyFromFrontmatter || mapping.specialty;
    const priority = mapping.priority ?? 0;
    const description = typeof data?.description === 'string' ? data.description : (mapping.description ?? '');

    const specialty = normalizeSpecialty(specialtyConfig);

    if (specialtyMapping && !specialtyMapping[specialty]) {
      console.log(
        `Пропускаем файл ${filePath}: специальность "${specialty}" не найдена в конфиге специальностей`,
      );

      return null;
    }

    const access = typeof data?.access === 'string' ? data.access.trim() : '';

    if (!access) {
      console.error(`Ошибка валидации файла ${filePath}: отсутствует обязательное поле access`);

      return null;
    }

    if (!Array.isArray(data?.tools)) {
      console.error(`Ошибка валидации файла ${filePath}: поле tools должно быть массивом строк`);

      return null;
    }

    if (data.tools.some((tool: unknown) => typeof tool !== 'string')) {
      console.error(`Ошибка валидации файла ${filePath}: поле tools должно содержать только строки`);

      return null;
    }

    const tools = data.tools;

    const orderValue = typeof data?.order === 'number' ? data.order : Number.NaN;

    if (!Number.isFinite(orderValue)) {
      console.error(`Ошибка валидации файла ${filePath}: поле order должно быть числом`);

      return null;
    }

    const createdAt = typeof data?.created_at === 'string' ? new Date(data.created_at) : null;
    const updatedAt = typeof data?.updated_at === 'string' ? new Date(data.updated_at) : null;

    if (!createdAt || Number.isNaN(createdAt.getTime())) {
      console.error(`Ошибка валидации файла ${filePath}: поле created_at должно быть валидной датой`);

      return null;
    }

    if (!updatedAt || Number.isNaN(updatedAt.getTime())) {
      console.error(`Ошибка валидации файла ${filePath}: поле updated_at должно быть валидной датой`);

      return null;
    }

    const title = data?.title || path.basename(filePath, '.md');
    if (Array.isArray(data?.tags) && data.tags.some((tag: unknown) => typeof tag !== 'string')) {
      console.error(`Ошибка валидации файла ${filePath}: поле tags должно содержать только строки`);

      return null;
    }

    const tags = Array.isArray(data?.tags) ? data.tags : [];

    const result: DocItem = {
      id: uid,
      uid,
      title,
      content: markdownContent,
      specialty,
      technology,
      priority,
      description,
      tags,
      info: validateLinks(data?.info),
      access,
      tools,
      order: orderValue,
      file_hash: calculateFileHash(content),
      created_at: createdAt,
      updated_at: updatedAt,
    };

    if (revisionMetadata) {
      result.sourceBranch = revisionMetadata.sourceBranch;
      result.sourceCommitSha = revisionMetadata.sourceCommitSha;
      result.sourcePath = revisionMetadata.sourcePath;
      result.importedAt = revisionMetadata.importedAt;
    }

    return result;
  } catch (error) {
    console.error(`Ошибка обработки файла ${filePath}:`, error);

    return null;
  }
}
