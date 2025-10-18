import { Pool } from 'pg';
import { clearDatabaseSchema } from './schema';
import { DatabaseConfig } from '../../../types';
import { DB_CONFIG } from '../../../config';

/**
 * Функция для очистки базы данных
 *
 * Создает временный экземпляр DatabaseManager, очищает
 * все данные и автоматически закрывает соединение.
 *
 * @param config - Конфигурация подключения к PostgreSQL (опционально)
 * @returns Promise который разрешается после очистки
 *
 * @example
 * ```typescript
 * import { clearDatabase } from '2shark';
 *
 * // Очистка с дефолтными настройками
 * await clearDatabase();
 *
 * // Очистка с кастомной конфигурацией
 * await clearDatabase({
 *   host: 'my-db-host.com',
 *   port: 5432,
 *   database: 'docs_db',
 *   user: 'docs_user',
 *   password: 'secure_password'
 * });
 * ```
 *
 * @throws {Error} При ошибках подключения к базе данных
 */
export async function clearDatabase(config?: DatabaseConfig): Promise<void> {
  const dbConfig: DatabaseConfig = config || DB_CONFIG;

  const pool = new Pool(dbConfig);
  const client = await pool.connect();

  try {
    await clearDatabaseSchema(client);
  } finally {
    client.release();
    await pool.end();
  }
}
