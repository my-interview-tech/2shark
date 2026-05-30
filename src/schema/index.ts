/**
 * SQL запросы для работы с базой данных документации
 *
 * @module DatabaseSchema
 */

// ============================================================================
// SELECT QUERIES
// ============================================================================

/**
 * Запрос для проверки существования таблицы в базе данных
 * @param {string} tableName - Имя таблицы для проверки
 * @returns {boolean} - true если таблица существует, false если нет
 */
const CHECK_TABLE_EXISTS_QUERY = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )
      `;

/**
 * Запрос для получения хешей файлов из таблицы статей
 * Используется для отслеживания изменений в документации
 */
const GET_FILE_HASHES_QUERY = `
      SELECT slug, file_hash 
      FROM articles 
      WHERE file_hash IS NOT NULL
    `;

// ============================================================================
// CREATE TABLE QUERIES
// ============================================================================

/**
 * Запрос для создания таблицы специальностей
 * Создает таблицу specialties с полями: id, name, slug, priority, created_at
 */
const CREATE_SPECIALTIES_TABLE_QUERY = `
    CREATE TABLE IF NOT EXISTS specialties (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      slug VARCHAR(255) NOT NULL UNIQUE,
      priority INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

/**
 * Запрос для создания таблицы технологий
 * Создает таблицу technologies с полями: id, name, slug, priority, created_at
 */
const CREATE_TECHNOLOGIES_TABLE_QUERY = `
    CREATE TABLE IF NOT EXISTS technologies (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) NOT NULL UNIQUE,
      priority INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
`;

/**
 * Запрос для создания связующей таблицы специальностей и технологий
 * Создает таблицу specialty_technology для связи many-to-many
 */
const CREATE_SPECIALTY_TECHNOLOGY_TABLE_QUERY = `
    CREATE TABLE IF NOT EXISTS specialty_technology (
      id SERIAL PRIMARY KEY,
      specialty_id INTEGER REFERENCES specialties(id) ON DELETE CASCADE,
      technology_id INTEGER REFERENCES technologies(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      UNIQUE(specialty_id, technology_id)
    )
  `;

/**
 * Запрос для создания основной таблицы статей
 * Создает таблицу articles с полями для хранения контента документации
 */
const CREATE_ARTICLES_TABLE_QUERY = `
    CREATE TABLE IF NOT EXISTS articles (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      slug VARCHAR(255) NOT NULL,
      content TEXT,
      specialty_id INTEGER REFERENCES specialties(id) ON DELETE CASCADE,
      technology_id INTEGER REFERENCES technologies(id) ON DELETE CASCADE,
      priority INTEGER DEFAULT 0,
      description TEXT,
      file_hash VARCHAR(64),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

/**
 * Запрос для создания таблицы тегов
 * Создает таблицу tags для хранения тегов статей
 */
const CREATE_TAGS_TABLE_QUERY = `
    CREATE TABLE IF NOT EXISTS tags (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

/**
 * Запрос для создания связующей таблицы статей и тегов
 * Создает таблицу article_tags для связи many-to-many между статьями и тегами
 */
const CREATE_ARTICLE_TAGS_TABLE_QUERY = `
    CREATE TABLE IF NOT EXISTS article_tags (
      id SERIAL PRIMARY KEY,
      article_id INTEGER REFERENCES articles(id) ON DELETE CASCADE,
      tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
      UNIQUE(article_id, tag_id)
    )
  `;

/**
 * Запрос для создания таблицы ссылок статей
 * Создает таблицу article_links для хранения внешних ссылок к статьям
 */
const CREATE_ARTICLE_LINKS_TABLE_QUERY = `
    CREATE TABLE IF NOT EXISTS article_links (
      id SERIAL PRIMARY KEY,
      article_id INTEGER REFERENCES articles(id) ON DELETE CASCADE,
      url TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(article_id, url)
)
`;

// ============================================================================
// DELETE DATA QUERIES
// ============================================================================

/**
 * Запрос для удаления всех данных из таблицы связей статей и тегов
 * Используется при очистке базы данных
 */
const DELETE_ARTICLE_TAGS_DATA_QUERY = `DELETE FROM article_tags`;

/**
 * Запрос для удаления всех данных из таблицы ссылок статей
 * Используется при очистке базы данных
 */
const DELETE_ARTICLE_LINKS_DATA_QUERY = `DELETE FROM article_links`;

/**
 * Запрос для удаления всех данных из таблицы тегов
 * Используется при очистке базы данных
 */
const DELETE_TAGS_DATA_QUERY = `DELETE FROM tags`;

/**
 * Запрос для удаления всех данных из таблицы статей
 * Используется при очистке базы данных
 */
const DELETE_ARTICLES_DATA_QUERY = `DELETE FROM articles`;

/**
 * Запрос для удаления всех данных из таблицы специальностей
 * Используется при очистке базы данных
 */
const DELETE_SPECIALTIES_DATA_QUERY = `DELETE FROM specialties`;

/**
 * Запрос для удаления всех данных из таблицы технологий
 * Используется при очистке базы данных
 */
const DELETE_TECHNOLOGIES_DATA_QUERY = `DELETE FROM technologies`;

/**
 * Запрос для удаления всех данных из связующей таблицы специальностей и технологий
 * Используется при очистке базы данных
 */
const DELETE_SPECIALTY_TECHNOLOGY_DATA_QUERY = `DELETE FROM specialty_technology`;

// ============================================================================
// DROP TABLE QUERIES
// ============================================================================

/**
 * Запрос для удаления таблицы статей с каскадным удалением зависимостей
 * Используется при полной очистке схемы базы данных
 */
const DROP_ARTICLES_TABLE_QUERY = `DROP TABLE articles CASCADE`;

/**
 * Запрос для удаления связующей таблицы специальностей и технологий с каскадным удалением
 * Используется при полной очистке схемы базы данных
 */
const DROP_SPECIALTY_TECHNOLOGY_TABLE_QUERY = `DROP TABLE IF EXISTS specialty_technology CASCADE`;

// ============================================================================
// UPSERT QUERIES
// ============================================================================

/**
 * Запрос для вставки или обновления специальности
 * Использует UPSERT (INSERT ... ON CONFLICT DO UPDATE) для обработки дубликатов
 * @param {string} name - Название специальности
 * @param {string} slug - Уникальный идентификатор специальности
 * @param {number} priority - Приоритет специальности
 * @returns {number} - ID созданной или обновленной специальности
 */
const UPSERT_SPECIALTY_QUERY = `INSERT INTO specialties (name, slug, priority) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (slug) DO UPDATE SET 
         name = EXCLUDED.name, priority = EXCLUDED.priority 
         RETURNING id`;

/**
 * Запрос для вставки или обновления технологии
 * Использует UPSERT (INSERT ... ON CONFLICT DO UPDATE) для обработки дубликатов
 * @param {string} name - Название технологии
 * @param {string} slug - Уникальный идентификатор технологии
 * @param {number} priority - Приоритет технологии
 * @returns {number} - ID созданной или обновленной технологии
 */
const UPSERT_TECHNOLOGY_QUERY = `INSERT INTO technologies (name, slug, priority) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (slug) DO UPDATE SET 
         name = EXCLUDED.name, priority = EXCLUDED.priority 
         RETURNING id`;

/**
 * Запрос для вставки или обновления связи специальности и технологии
 * Использует UPSERT для обработки дубликатов по составному ключу
 * @param {number} specialtyId - ID специальности
 * @param {number} technologyId - ID технологии
 * @param {string} name - Название связи
 */
const UPSERT_SPECIALTY_TECHNOLOGY_QUERY = `INSERT INTO specialty_technology (specialty_id, technology_id, name) 
        VALUES ($1, $2, $3) 
        ON CONFLICT (specialty_id, technology_id) DO UPDATE SET name = EXCLUDED.name
        RETURNING id`;

// ============================================================================
// INSERT QUERIES
// ============================================================================

/**
 * Запрос для вставки новой статьи
 * Создает новую запись в таблице articles
 * @param {string} title - Заголовок статьи
 * @param {string} slug - Уникальный идентификатор статьи
 * @param {string} content - Содержимое статьи
 * @param {number} specialtyId - ID специальности
 * @param {number} technologyId - ID технологии
 * @param {number} priority - Приоритет статьи
 * @param {string} description - Описание статьи
 * @param {string} fileHash - Хеш файла для отслеживания изменений
 * @returns {number} - ID созданной статьи
 */
const INSERT_ARTICLE_QUERY = `INSERT INTO articles (title, slug, content, specialty_id, technology_id, priority, description, file_hash) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
         RETURNING id`;

/**
 * Запрос для создания связи между статьей и тегом
 * Использует INSERT с ON CONFLICT DO NOTHING для избежания дубликатов
 * @param {number} articleId - ID статьи
 * @param {number} tagId - ID тега
 */
const INSERT_ARTICLE_TAG_QUERY = `INSERT INTO article_tags (article_id, tag_id) 
         VALUES ($1, $2) 
         ON CONFLICT (article_id, tag_id) DO NOTHING
         RETURNING id`;

/**
 * Запрос для создания ссылки к статье
 * Использует INSERT с ON CONFLICT DO NOTHING для избежания дубликатов
 * @param {number} articleId - ID статьи
 * @param {string} url - URL ссылки
 */
const INSERT_ARTICLE_LINK_QUERY = `INSERT INTO article_links (article_id, url) 
         VALUES ($1, $2) 
         ON CONFLICT (article_id, url) DO NOTHING
         RETURNING id`;

/**
 * Запрос для вставки или обновления тега
 * Использует UPSERT для обработки дубликатов по имени тега
 * @param {string} name - Название тега
 * @returns {number} - ID созданного или обновленного тега
 */
const INSERT_TAG_QUERY = `INSERT INTO tags (name) 
         VALUES ($1) 
         ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name 
         RETURNING id`;

export const SCHEMA = {
  // SELECT queries
  CHECK_TABLE_EXISTS_QUERY,
  GET_FILE_HASHES_QUERY,

  // CREATE TABLE queries
  CREATE_SPECIALTIES_TABLE_QUERY,
  CREATE_TECHNOLOGIES_TABLE_QUERY,
  CREATE_SPECIALTY_TECHNOLOGY_TABLE_QUERY,
  CREATE_ARTICLES_TABLE_QUERY,
  CREATE_TAGS_TABLE_QUERY,
  CREATE_ARTICLE_TAGS_TABLE_QUERY,
  CREATE_ARTICLE_LINKS_TABLE_QUERY,

  // DELETE DATA queries
  DELETE_ARTICLE_TAGS_DATA_QUERY,
  DELETE_ARTICLE_LINKS_DATA_QUERY,
  DELETE_TAGS_DATA_QUERY,
  DELETE_ARTICLES_DATA_QUERY,
  DELETE_SPECIALTIES_DATA_QUERY,
  DELETE_TECHNOLOGIES_DATA_QUERY,
  DELETE_SPECIALTY_TECHNOLOGY_DATA_QUERY,

  // DROP TABLE queries
  DROP_ARTICLES_TABLE_QUERY,
  DROP_SPECIALTY_TECHNOLOGY_TABLE_QUERY,

  // UPSERT queries
  UPSERT_SPECIALTY_QUERY,
  UPSERT_TECHNOLOGY_QUERY,
  UPSERT_SPECIALTY_TECHNOLOGY_QUERY,

  // INSERT queries
  INSERT_ARTICLE_QUERY,
  INSERT_ARTICLE_TAG_QUERY,
  INSERT_ARTICLE_LINK_QUERY,
  INSERT_TAG_QUERY,
} as const;
