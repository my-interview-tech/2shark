import { PoolClient } from 'pg';
import { deletes } from './config';

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
export async function clearDatabaseSchema(client: Pick<PoolClient, 'query'>): Promise<void> {
  await client.query('BEGIN');
  try {
    for (const sql of deletes) {
      await client.query(sql);
    }

    await client.query('COMMIT');
    console.log('База данных очищена');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}
