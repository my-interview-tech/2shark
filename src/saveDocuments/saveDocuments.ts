import { Pool } from 'pg';
import { DB_CONFIG } from '../config';
import { collectAndSaveEntities, saveArticles } from './lib';
import { TSaveDocuments } from './types';

/**
 * Сохраняет документы в базу данных
 *
 * Создает записи в таблицах:
 * - specialties: специальности
 * - technologies: технологии
 * - articles: статьи документации
 * - tags: теги
 * - article_tags: связь статей и тегов
 *
 * @param documents - Массив документов для сохранения
 * @param config - Конфигурация подключения к PostgreSQL (опционально)
 * @param technologyMapping - Маппинг категорий (опционально)
 * @param specialtyMapping - Маппинг специальностей (опционально)
 * @returns Promise который разрешается после сохранения
 *
 * @throws {Error} При ошибках подключения к базе данных или сохранения
 */
export async function saveDocuments(
  { documents, config, technologyMapping, specialtyMapping }: TSaveDocuments,
): Promise<void> {
  const dbConfig = config || DB_CONFIG;
  const pool = new Pool(dbConfig);
  const client = await pool.connect();
  const debug = process.env.DEBUG_SAVE === '1';

  try {
    await client.query('BEGIN');

    // Собирает и сохраняет специальности и технологии
    const { specialtyIds, technologyIds } = await collectAndSaveEntities(
      {
        client,
        documents,
        technologyMapping,
        specialtyMapping,
        debug
      }
    );

    // Сохраняет статьи и их связи (теги, ссылки) для набора документов
    await saveArticles({
      client,
      documents,
      specialtyIds,
      technologyIds,
      technologyMapping,
      debug
    });

    await client.query('COMMIT');

    if (debug) {
      console.log(`Сохранено ${documents.length} документов в базу данных`);
    }
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}
