import { DocsScanner } from './class/DocsScanner';
import { DocItem, ScanOptions } from '../types';
import { DEFAULT_OPTIONS } from './config';

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
 *   configPath: {
 *     technologyPath: './config/technology-mapping.yaml',
 *     specialtiesPath: './config/specialties.yaml'
 *   }
 * });
 *
 * console.log(`Найдено ${items.length} документов`);
 * ```
 */
export async function parseDatabase(options: ScanOptions = DEFAULT_OPTIONS): Promise<DocItem[]> {
  const scanner = new DocsScanner(options);

  try {
    return await scanner.scanDocs();
  } finally {
    await scanner.close();
  }
}
