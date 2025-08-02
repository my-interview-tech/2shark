import fs from 'fs/promises';
import { Pool } from 'pg';
import path from 'path';
import { loadCategoryMapping, scanDirectory } from '../lib';
import { CategoryMapping, DocItem, ScanOptions, DatabaseConfig } from '../../types';
import { DB_CONFIG } from '../../config';

/**
 * Сканер документации для обработки Markdown файлов и их сохранения в базу данных
 *
 * @example
 * ```typescript
 * const scanner = new DocsScanner({
 *   docsPath: './docs',
 *   configPath: './config/category-mapping.yaml'
 * });
 *
 * const items = await scanner.scanDocs();
 * await scanner.close();
 * ```
 */
export class DocsScanner {
  private pool: Pool;
  private categoryMapping: CategoryMapping;
  private options: ScanOptions;

  constructor(options: ScanOptions = {}) {
    this.pool = new Pool(DB_CONFIG);
    this.options = options;
    this.categoryMapping = loadCategoryMapping(options);
  }

  /**
   * Сканирует директорию с документацией и возвращает массив обработанных документов
   *
   * @param docsPath - Путь к директории с документацией (опционально, переопределяет docsPath из options)
   * @returns Promise с массивом обработанных документов
   *
   * @example
   * ```typescript
   * const items = await scanner.scanDocs('./my-docs');
   * 
   * console.log(`Найдено ${items.length} документов`);
   * ```
   *
   * @throws {Error} Если директория не найдена
   */
  async scanDocs(docsPath?: string): Promise<DocItem[]> {
    const scanPath = docsPath || this.options.docsPath || path.join(process.cwd(), 'docs');

    try {
      await fs.access(scanPath);
    } catch {
      throw new Error(`Директория ${scanPath} не найдена`);
    }

    const items: DocItem[] = [];

    await scanDirectory({dirPath: scanPath, items, categoryMapping: this.categoryMapping});
  
    return items;
  }

  /**
   * Закрывает соединение с базой данных
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}
