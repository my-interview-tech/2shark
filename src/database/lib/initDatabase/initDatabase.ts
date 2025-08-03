import { Pool } from 'pg';
import { DatabaseConfig } from '../../../types';
import { DB_CONFIG } from '../../../config';
import { SCHEMA } from '../../../schema';

/**
 * Инициализирует схему базы данных
 *
 * Создает все необходимые таблицы для хранения документации:
 * - specialties: специальности (Frontend, Backend, etc.)
 * - technologies: технологии (React, TypeScript, etc.)
 * - specialty_technology: связь специальности и технологии
 * - articles: статьи документации
 * - tags: теги для статей
 * - article_tags: связь статей и тегов
 *
 * @param client - Клиент PostgreSQL
 * @returns Promise который разрешается после инициализации
 *
 * @throws {Error} При ошибках создания таблиц
 */
export async function initDatabaseSchema(client: any): Promise<void> {
  const tableExists = async (tableName: string): Promise<boolean> => {
    try {
      const result = await client.query(SCHEMA.CHECK_TABLE_EXISTS_QUERY, [tableName]);
      return result.rows[0].exists;
    } catch {
      return false;
    }
  };

  if (await tableExists('article_tags')) {
    await client.query(SCHEMA.DELETE_ARTICLE_TAGS_DATA_QUERY);
  }
  if (await tableExists('article_links')) {
    await client.query(SCHEMA.DELETE_ARTICLE_LINKS_DATA_QUERY);
  }
  if (await tableExists('tags')) {
    await client.query(SCHEMA.DELETE_TAGS_DATA_QUERY);
  }
  if (await tableExists('articles')) {
    await client.query(SCHEMA.DROP_ARTICLES_TABLE_QUERY);
  }
  if (await tableExists('specialties')) {
    await client.query(SCHEMA.DELETE_SPECIALTIES_DATA_QUERY);
  }
  if (await tableExists('technologies')) {
    await client.query(SCHEMA.DELETE_TECHNOLOGIES_DATA_QUERY);
  }

  await client.query(SCHEMA.CREATE_SPECIALTIES_TABLE_QUERY);

  await client.query(SCHEMA.CREATE_TECHNOLOGIES_TABLE_QUERY);

  await client.query(SCHEMA.DROP_SPECIALTY_TECHNOLOGY_TABLE_QUERY);

  await client.query(SCHEMA.CREATE_SPECIALTY_TECHNOLOGY_TABLE_QUERY);

  await client.query(SCHEMA.CREATE_ARTICLES_TABLE_QUERY);

  await client.query(SCHEMA.CREATE_TAGS_TABLE_QUERY);

  await client.query(SCHEMA.CREATE_ARTICLE_TAGS_TABLE_QUERY);

  await client.query(SCHEMA.CREATE_ARTICLE_LINKS_TABLE_QUERY);

  console.log('База данных инициализирована');
}

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
