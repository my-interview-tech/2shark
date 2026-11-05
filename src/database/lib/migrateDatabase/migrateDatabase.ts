import { Pool, PoolClient } from 'pg';
import { DatabaseConfig } from '../../../types';
import { DB_CONFIG } from '../../../config';
import { SCHEMA } from '../../../schema';

/**
 * Применяет неразрушающие миграции read model (`db-0007`) в одной транзакции.
 *
 * В отличие от `initDatabaseSchema` не удаляет данные: каждый запрос — `ADD COLUMN IF NOT EXISTS`
 * или `CREATE INDEX IF NOT EXISTS`, поэтому миграцию безопасно запускать перед каждым импортом.
 *
 * @param client - Клиент PostgreSQL, поддерживающий метод `query`
 * @throws {Error} При ошибке любого шага (все изменения откатываются)
 */
export async function migrateDatabaseSchema(client: Pick<PoolClient, 'query'>): Promise<void> {
  await client.query('BEGIN');

  try {
    for (const query of SCHEMA.MIGRATE_DB_0007_QUERIES) {
      await client.query(query);
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

/**
 * Подключается к базе и применяет неразрушающие миграции read model.
 *
 * @param config - Конфигурация подключения к PostgreSQL (опционально)
 */
export async function migrateDatabase(config?: DatabaseConfig): Promise<void> {
  const pool = new Pool(config || DB_CONFIG);
  const client = await pool.connect();

  try {
    await migrateDatabaseSchema(client);
  } finally {
    client.release();
    await pool.end();
  }
}
