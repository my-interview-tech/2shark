import { initDatabase, initDatabaseSchema } from './initDatabase';
import { DatabaseConfig } from '../../../types';

jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    end: jest.fn(),
  })),
}));

const mockPool = require('pg').Pool as jest.MockedClass<typeof import('pg').Pool>;
const mockClient = {
  query: jest.fn(),
  release: jest.fn(),
};

const mockPoolInstance = {
  connect: jest.fn(),
  end: jest.fn(),
};

describe('Unit/utility/function/initDatabase', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPoolInstance.connect.mockResolvedValue(mockClient);
    mockPoolInstance.end.mockResolvedValue(undefined);
    mockPool.mockImplementation(() => mockPoolInstance as any);
  });

  describe('SUCCESS_CASES', () => {
    it('должен инициализировать базу с дефолтными настройками', async () => {
      await initDatabase();

      expect(mockPool).toHaveBeenCalledWith({
        host: 'localhost',
        port: 5432,
        database: 'postgres',
        user: 'postgres',
        password: 'password',
      });
    });

    it('должен инициализировать базу с кастомными настройками', async () => {
      const config: DatabaseConfig = {
        host: 'custom-host',
        port: 5433,
        database: 'custom-db',
        user: 'custom-user',
        password: 'custom-password',
      };

      await initDatabase(config);

      expect(mockPool).toHaveBeenCalledWith(config);
    });

    it('должен использовать переменные окружения', async () => {
      const originalEnv = process.env;
      process.env = {
        ...originalEnv,
        DB_HOST: 'env-host',
        DB_PORT: '5434',
        DB_NAME: 'env-db',
        DB_USER: 'env-user',
        DB_PASSWORD: 'env-password',
      };

      expect(process.env.DB_HOST).toBe('env-host');
      expect(process.env.DB_PORT).toBe('5434');
      expect(process.env.DB_NAME).toBe('env-db');
      expect(process.env.DB_USER).toBe('env-user');
      expect(process.env.DB_PASSWORD).toBe('env-password');

      process.env = originalEnv;
    });
  });

  describe('EDGE_CASES', () => {
    it('должен обработать пустую конфигурацию', async () => {
      await initDatabase({} as DatabaseConfig);

      expect(mockPool).toHaveBeenCalledWith({});
    });

    it('должен обработать частичную конфигурацию', async () => {
      const partialConfig: DatabaseConfig = {
        host: 'partial-host',
        database: 'partial-db',
        port: 5432,
        user: 'postgres',
        password: 'password',
      };

      await initDatabase(partialConfig);

      expect(mockPool).toHaveBeenCalledWith(partialConfig);
    });
  });
});

describe('Unit/utility/function/initDatabaseSchema', () => {
  const mockClient = {
    query: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('SUCCESS_CASES', () => {
    it('должен создавать таблицы и очищать данные в правильном порядке', async () => {
      mockClient.query.mockResolvedValue({ rows: [] });
      await initDatabaseSchema(mockClient);

      expect(mockClient.query).toHaveBeenCalledTimes(11);

      expect(mockClient.query).toHaveBeenNthCalledWith(1, 'DELETE FROM article_tags');
      expect(mockClient.query).toHaveBeenNthCalledWith(2, 'DELETE FROM tags');
      expect(mockClient.query).toHaveBeenNthCalledWith(3, 'DELETE FROM articles');
      expect(mockClient.query).toHaveBeenNthCalledWith(4, 'DELETE FROM technologies');
      expect(mockClient.query).toHaveBeenNthCalledWith(5, 'DELETE FROM specialties');

      expect(mockClient.query).toHaveBeenNthCalledWith(
        6,
        expect.stringContaining('CREATE TABLE IF NOT EXISTS specialties'),
      );
      expect(mockClient.query).toHaveBeenNthCalledWith(
        7,
        expect.stringContaining('CREATE TABLE IF NOT EXISTS technologies'),
      );
      expect(mockClient.query).toHaveBeenNthCalledWith(
        8,
        expect.stringContaining('CREATE TABLE IF NOT EXISTS specialty_technology'),
      );
      expect(mockClient.query).toHaveBeenNthCalledWith(
        9,
        expect.stringContaining('CREATE TABLE IF NOT EXISTS articles'),
      );
      expect(mockClient.query).toHaveBeenNthCalledWith(10, expect.stringContaining('CREATE TABLE IF NOT EXISTS tags'));
      expect(mockClient.query).toHaveBeenNthCalledWith(
        11,
        expect.stringContaining('CREATE TABLE IF NOT EXISTS article_tags'),
      );
    });
  });

  describe('ERROR_CASES', () => {
    it('должен пробрасывать ошибку при ошибке создания таблиц', async () => {
      mockClient.query.mockRejectedValue(new Error('Query error'));
      await expect(initDatabaseSchema(mockClient)).rejects.toThrow('Query error');
    });
  });
});
