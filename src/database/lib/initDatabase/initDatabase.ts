import { Pool } from 'pg';
import { DatabaseConfig } from '../../../types';
import { DB_CONFIG } from '../../../config';

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
  // Очищаем существующие данные
  await client.query('DELETE FROM article_tags');
  await client.query('DELETE FROM tags');
  await client.query('DELETE FROM articles');
  await client.query('DELETE FROM technologies');
  await client.query('DELETE FROM specialties');

  // Создаем таблицы
  await client.query(`
    CREATE TABLE IF NOT EXISTS specialties (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      slug VARCHAR(255) NOT NULL UNIQUE,
      priority INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS technologies (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) NOT NULL UNIQUE,
      priority INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS specialty_technology (
      id SERIAL PRIMARY KEY,
      specialty_id INTEGER REFERENCES specialties(id) ON DELETE CASCADE,
      technology_id INTEGER REFERENCES technologies(id) ON DELETE CASCADE,
      UNIQUE(specialty_id, technology_id)
    )
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS articles (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      slug VARCHAR(255) NOT NULL UNIQUE,
      content TEXT,
      specialty_id INTEGER REFERENCES specialties(id) ON DELETE CASCADE,
      technology_id INTEGER REFERENCES technologies(id) ON DELETE CASCADE,
      priority INTEGER DEFAULT 0,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS tags (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS article_tags (
      id SERIAL PRIMARY KEY,
      article_id INTEGER REFERENCES articles(id) ON DELETE CASCADE,
      tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
      UNIQUE(article_id, tag_id)
    )
  `);

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
