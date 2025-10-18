import { Pool } from 'pg';
import { DatabaseConfig } from '../../../types';
import { DB_CONFIG } from '../../../config';
import { initDatabaseSchema } from './schema';

/**
 * Функция для инициализации базы данных
 *
 * Создает временный экземпляр DatabaseManager, инициализирует
 * базу данных и автоматически закрывает соединение.
 *
 * @param config - Конфигурация подключения к PostgreSQL (опционально)
 * @returns Promise который разрешается после инициализации
 *
 * @example
 * ```typescript
 * import { initDatabase } from '2shark';
 *
 * // Использование переменных окружения
 * await initDatabase();
 *
 * // Кастомная конфигурация
 * await initDatabase({
 *   host: 'localhost',
 *   port: 5432,
 *   database: 'docs_db',
 *   user: 'postgres',
 *   password: 'password'
 * });
 * ```
 *
 * @throws {Error} При ошибках подключения к базе данных или создания таблиц
 */
export async function initDatabase(config?: DatabaseConfig): Promise<void> {
  const dbConfig: DatabaseConfig = config || DB_CONFIG;

  const pool = new Pool(dbConfig);
  const client = await pool.connect();

  try {
    await initDatabaseSchema(client);
  } finally {
    client.release();
    await pool.end();
  }
}
