import fs from 'fs/promises';
import { Pool } from 'pg';
import path from 'path';
import { loadYAMLContent, scanDirectory } from '../lib';
import { DocItem, ScanOptions, TechnologyMapping, SpecialtyMapping } from '../../types';
import { DB_CONFIG } from '../../config';
import { DEFAULT_OPTIONS } from '../config';

/**
 * Сканер документации для обработки Markdown файлов и их сохранения в базу данных
 */
export class DocsScanner {
  private pool: Pool;
  private technologyMapping: TechnologyMapping;
  private specialtyMapping: SpecialtyMapping;
  private options: ScanOptions;

  constructor(options: ScanOptions = DEFAULT_OPTIONS) {
    const {
      configPath: { technologyPath, specialtiesPath },
    } = options;

    // TODO:необходимо позволить конфигурировать соединение с базой данных для клиента
    this.pool = new Pool(DB_CONFIG);
    this.options = options;
    this.technologyMapping = loadYAMLContent<TechnologyMapping>(technologyPath);
    this.specialtyMapping = loadYAMLContent<SpecialtyMapping>(specialtiesPath);
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

    await scanDirectory({
      dirPath: scanPath,
      items,
      technologyMapping: this.technologyMapping,
      specialtyMapping: this.specialtyMapping,
    });

    return items;
  }

  /**
   * Закрывает соединение с базой данных
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}
