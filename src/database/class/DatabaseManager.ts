import { Pool } from 'pg';
import { initDatabaseSchema, clearDatabaseSchema } from '../lib';
import { DB_CONFIG } from '../../config';
import { DatabaseConfig } from '../../types';

/**
 * Менеджер базы данных для работы с PostgreSQL
 *
 * Обеспечивает инициализацию схемы базы данных, очистку данных
 * и управление соединениями с PostgreSQL.
 *
 * @example
 * ```typescript
 * import { DatabaseManager } from '2shark';
 *
 * const db = new DatabaseManager({
 *   host: 'localhost',
 *   port: 5432,
 *   database: 'my_docs',
 *   user: 'postgres',
 *   password: 'password'
 * });
 *
 * await db.initDatabase();
 * await db.close();
 * ```
 */
export class DatabaseManager {
  private pool: Pool;

  constructor(config?: DatabaseConfig) {
    const dbConfig: DatabaseConfig = config || DB_CONFIG;

    this.pool = new Pool(dbConfig);
  }

  async initDatabase(): Promise<void> {
    const client = await this.pool.connect();

    try {
      await initDatabaseSchema(client);
    } finally {
      client.release();
    }
  }

  async clearDatabase(): Promise<void> {
    const client = await this.pool.connect();

    try {
      await clearDatabaseSchema(client);
    } finally {
      client.release();
    }
  }

  /**
   * Закрывает соединение с базой данных
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}
