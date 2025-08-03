import { Pool } from 'pg';
import { DatabaseConfig } from '../../types';
import { DB_CONFIG } from '../../config';
import { SCHEMA } from '../../schema';

/**
 * Получает хеши существующих файлов из базы данных
 *
 * @param config - Конфигурация подключения к PostgreSQL (опционально)
 * @returns Promise с Map где ключ - slug файла, значение - хеш
 *
 * @example
 * ```typescript
 * const hashes = await getFileHashes();
 * console.log(hashes.get('my-article')); // "a1b2c3d4..."
 * ```
 */
export async function getFileHashes(config?: DatabaseConfig): Promise<Map<string, string>> {
  const dbConfig: DatabaseConfig = config || DB_CONFIG;
  const pool = new Pool(dbConfig);
  const client = await pool.connect();

  try {
    const result = await client.query(SCHEMA.GET_FILE_HASHES_QUERY);

    const hashes = new Map<string, string>();
    for (const row of result.rows) {
      hashes.set(row.slug, row.file_hash);
    }

    return hashes;
  } catch (error) {
    console.error('Ошибка при получении хешей файлов:', error);
    return new Map();
  } finally {
    client.release();
    await pool.end();
  }
}
