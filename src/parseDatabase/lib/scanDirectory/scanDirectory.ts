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
 * @param params.categoryMapping - Объект маппинга категорий
 */
export async function scanDirectory({ dirPath, items, categoryMapping }: ScanDirectoryParams): Promise<void> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      await scanDirectory({ dirPath: fullPath, items, categoryMapping });
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      const item = await processMarkdownFile(fullPath, categoryMapping);

      if (item) {
        items.push(item);
      }
    }
  }
}
