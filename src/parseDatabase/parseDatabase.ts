import { DocsScanner } from './class/DocsScanner';
import { DocItem, ScanOptions } from '../types';

/**
 * Функция для быстрого сканирования документации
 *
 * @param options - Опции конфигурации сканера
 * @returns Promise с массивом обработанных документов
 *
 * @example
 * ```typescript
 * import { parseDatabase } from '2shark';
 *
 * const items = await parseDatabase({
 *   docsPath: './docs',
 *   configPath: './config/technology-mapping.yaml'
 * });
 *
 * console.log(`Найдено ${items.length} документов`);
 * ```
 */
export async function parseDatabase(options: ScanOptions = {}): Promise<DocItem[]> {
  const scanner = new DocsScanner(options);

  try {
    return await scanner.scanDocs();
  } finally {
    await scanner.close();
  }
}
