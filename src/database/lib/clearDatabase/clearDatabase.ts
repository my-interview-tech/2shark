import { Pool } from 'pg';
import { DatabaseConfig } from '../../../types';
import { DB_CONFIG } from '../../../config';
import { SCHEMA } from '../../../schema';

/**
 * Очищает все данные из базы данных
 *
 * Удаляет все записи из всех таблиц в правильном порядке
 * для соблюдения внешних ключей.
 *
 * @param client - Клиент PostgreSQL
 * @returns Promise который разрешается после очистки
 *
 * @throws {Error} При ошибках подключения к базе данных
 */
export async function clearDatabaseSchema(client: any): Promise<void> {
  await client.query(SCHEMA.DELETE_ARTICLE_TAGS_DATA_QUERY);
  await client.query(SCHEMA.DELETE_TAGS_DATA_QUERY);
  await client.query(SCHEMA.DELETE_ARTICLES_DATA_QUERY);
  await client.query(SCHEMA.DELETE_TECHNOLOGIES_DATA_QUERY);
  await client.query(SCHEMA.DELETE_SPECIALTIES_DATA_QUERY);

  console.log('База данных очищена');
}

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
