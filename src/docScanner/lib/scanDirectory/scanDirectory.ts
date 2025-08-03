import fs from 'fs/promises';
import path from 'path';
import { processMarkdownFile } from '../processMarkdownFile';
import { ScanDirectoryParams } from './types';

/**
 * Рекурсивно сканирует директорию и обрабатывает Markdown файлы
 *
 * @param params - Параметры для сканирования директории
 * @param params.dirPath - Путь к директории для сканирования
 * @param params.items - Массив для накопления обработанных документов
 * @param params.technologyMapping - Объект маппинга категорий
 * @param params.specialtyMapping - Объект маппинга специальностей
 */
export async function scanDirectory({
  dirPath,
  items,
  technologyMapping,
  specialtyMapping,
}: ScanDirectoryParams): Promise<void> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    // todo: рефакторинг, избавиться от вложенности if.. else if
    if (entry.isDirectory()) {
      await scanDirectory({ dirPath: fullPath, items, technologyMapping, specialtyMapping });
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      const item = await processMarkdownFile({ filePath: fullPath, technologyMapping, specialtyMapping });

      if (item) {
        if (Array.isArray(item)) {
          items.push(...item);
        } else {
          items.push(item);
        }
      }
    }
  }
}
