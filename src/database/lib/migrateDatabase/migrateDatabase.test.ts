import { migrateDatabaseSchema } from './migrateDatabase';
import { SCHEMA } from '../../../schema';
import { DESCRIBE_CASES } from '../../../helpers/test';

describe('Unit/database/function/migrateDatabaseSchema', () => {
  describe(DESCRIBE_CASES.SUCCESS, () => {
    it('применяет все шаги db-0007 внутри транзакции', async () => {
      const client = { query: jest.fn().mockResolvedValue({ rows: [] }) };

      await migrateDatabaseSchema(client);

      const calls = client.query.mock.calls.map(([query]) => query);

      expect(calls[0]).toBe('BEGIN');
      expect(calls.slice(1, -1)).toEqual([...SCHEMA.MIGRATE_DB_0007_QUERIES]);
      expect(calls.at(-1)).toBe('COMMIT');
    });

    it('содержит только неразрушающие запросы', () => {
      for (const query of SCHEMA.MIGRATE_DB_0007_QUERIES) {
        expect(query).toMatch(/IF NOT EXISTS/);
        expect(query).not.toMatch(/\b(DROP|DELETE|TRUNCATE)\b/);
      }
    });
  });

  describe(DESCRIBE_CASES.ERROR, () => {
    it('откатывает транзакцию при ошибке шага', async () => {
      const client = {
        query: jest
          .fn()
          .mockResolvedValueOnce({ rows: [] })
          .mockRejectedValueOnce(new Error('boom'))
          .mockResolvedValue({ rows: [] }),
      };

      await expect(migrateDatabaseSchema(client)).rejects.toThrow('boom');
      expect(client.query).toHaveBeenLastCalledWith('ROLLBACK');
    });
  });
});
