import { PoolClient } from 'pg';
import { cleanupSteps, createQueries } from './config';
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
 * Особенности реализации:
 * - Вся инициализация выполняется транзакционно (`BEGIN`/`COMMIT`) с `ROLLBACK` при ошибках
 * - Очистка данных/таблиц выполняется условно по списку `cleanupSteps`
 * - Создание таблиц выполняется последовательно по списку `createQueries`
 *
 * См. конфигурацию шагов: `src/database/lib/initDatabase/config.ts`
 *
 * @param client - Клиент PostgreSQL, поддерживающий метод `query`
 * @returns Promise который разрешается после инициализации
 *
 * @throws {Error} При ошибках создания таблиц (все изменения откатываются)
 */
export async function initDatabaseSchema(client: Pick<PoolClient, 'query'>): Promise<void> {
  await client.query('BEGIN');

  try {
    const tableExists = async (tableName: string): Promise<boolean> => {
      try {
        const result = await client.query(SCHEMA.CHECK_TABLE_EXISTS_QUERY, [tableName]);

        return result.rows[0].exists;
      } catch {
        return false;
      }
    };

    for (const step of cleanupSteps) {
      if (await tableExists(step.table)) {
        await client.query(step.query);
      }
    }

    for (const query of createQueries) {
      await client.query(query);
    }

    await client.query('COMMIT');
    console.log('База данных инициализирована');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}
