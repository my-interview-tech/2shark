import { Pool } from 'pg';
import { DatabaseConfig } from '../../types';
import { DB_CONFIG } from '../../config';
import { SCHEMA } from '../../schema';

/**
 * Получает хеши существующих файлов из базы данных
 *
 * Используется:
 * - в `filterChangedFiles` для вычисления дельты изменений: сравнение текущих `file_hash`
 *   с сохранёнными в БД, чтобы пропускать неизменённые документы
 * - для ускорения повторных прогонов сканера/CI за счёт инкрементального обновления
 * - для отладочной статистики изменения документов
 *
 * @param config - Конфигурация подключения к PostgreSQL (опционально)
 * @returns Promise с Map где ключ - uid/slug файла, значение - `file_hash:::source_commit_sha`
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
      const key = row.uid || row.slug;
      const sourceCommitSha = typeof row.source_commit_sha === 'string' ? row.source_commit_sha : '';
      hashes.set(key, `${row.file_hash}:::${sourceCommitSha}`);
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
