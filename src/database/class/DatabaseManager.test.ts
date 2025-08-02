import { DatabaseManager } from './DatabaseManager';
import { initDatabaseSchema, clearDatabaseSchema } from '../lib';
import { DatabaseConfig } from '../../types';
import { DB_CONFIG } from '../../config';

jest.mock('pg', () => ({
  Pool: jest.fn(),
}));

const mockPool = require('pg').Pool as jest.MockedClass<typeof import('pg').Pool>;

jest.mock('../lib', () => {
  const original = jest.requireActual('../lib');
  return {
    ...original,
    initDatabaseSchema: jest.fn(),
    clearDatabaseSchema: jest.fn(),
  };
});

const mockInitDatabaseSchema = initDatabaseSchema as jest.MockedFunction<typeof initDatabaseSchema>;
const mockClearDatabaseSchema = clearDatabaseSchema as jest.MockedFunction<typeof clearDatabaseSchema>;
const mockClient = {
  query: jest.fn(),
  release: jest.fn(),
};

const mockPoolInstance = {
  connect: jest.fn(),
  end: jest.fn(),
};

describe('Unit/class/DatabaseManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPoolInstance.connect.mockResolvedValue(mockClient);
    mockPoolInstance.end.mockResolvedValue(undefined);
    mockPool.mockImplementation(() => mockPoolInstance as any);
    mockInitDatabaseSchema.mockResolvedValue(undefined);
    mockClearDatabaseSchema.mockResolvedValue(undefined);
  });

  describe('method/constructor', () => {
    it('создает экземпляр с дефолтной конфигурацией', () => {
      const db = new DatabaseManager();

      expect(mockPool).toHaveBeenCalledWith(DB_CONFIG);
      expect(db).toBeInstanceOf(DatabaseManager);
    });
  
    it('создает экземпляр с кастомной конфигурацией', () => {
      const config: DatabaseConfig = {
        host: 'custom-host',
        port: 5433,
        database: 'custom-db',
        user: 'custom-user',
        password: 'custom-password',
      };
      const db = new DatabaseManager(config);

      expect(mockPool).toHaveBeenCalledWith(config);
      expect(db).toBeInstanceOf(DatabaseManager);
    });

    it('создает экземпляр с пустой конфигурацией', () => {
      const db = new DatabaseManager({} as DatabaseConfig);

      expect(mockPool).toHaveBeenCalledWith({});
      expect(db).toBeInstanceOf(DatabaseManager);
    });

    it('создает экземпляр с partial конфигом', () => {
      const config: DatabaseConfig = {
        host: 'partial-host',
        database: 'partial-db',
        port: 5432,
        user: 'postgres',
        password: 'password',
      };
      const db = new DatabaseManager(config);

      expect(mockPool).toHaveBeenCalledWith(config);
      expect(db).toBeInstanceOf(DatabaseManager);
    });

    it('использует переменные окружения', () => {
      const originalEnv = process.env;
      process.env = {
        ...originalEnv,
        DB_HOST: 'env-host',
        DB_PORT: '5434',
        DB_NAME: 'env-db',
        DB_USER: 'env-user',
        DB_PASSWORD: 'env-password',
      };

      const db = new DatabaseManager();

      expect(mockPool).toHaveBeenCalledWith(DB_CONFIG);

      process.env = originalEnv;

      expect(db).toBeInstanceOf(DatabaseManager);
    });
  });

  describe('method/initDatabase', () => {
    it('инициализирует базу и вызывает release', async () => {
      const db = new DatabaseManager();
      await db.initDatabase();

      expect(mockPoolInstance.connect).toHaveBeenCalled();
      expect(mockInitDatabaseSchema).toHaveBeenCalledWith(mockClient);
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('вызывает release даже при ошибке', async () => {
      mockInitDatabaseSchema.mockRejectedValue(new Error('Schema error'));
      const db = new DatabaseManager();

      await expect(db.initDatabase()).rejects.toThrow('Schema error');

      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('method/clearDatabase', () => {
    it('очищает базу и вызывает release', async () => {
      const db = new DatabaseManager();
      await db.clearDatabase();

      expect(mockPoolInstance.connect).toHaveBeenCalled();
      expect(mockClearDatabaseSchema).toHaveBeenCalledWith(mockClient);
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('вызывает release даже при ошибке', async () => {
      mockClearDatabaseSchema.mockRejectedValue(new Error('Clear error'));

      const db = new DatabaseManager();
      await expect(db.clearDatabase()).rejects.toThrow('Clear error');

      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('method/close', () => {
    it('закрывает пул соединений', async () => {
      const db = new DatabaseManager();
      await db.close();

      expect(mockPoolInstance.end).toHaveBeenCalled();
    });
  });
});
