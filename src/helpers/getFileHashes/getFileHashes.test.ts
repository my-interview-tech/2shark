import { Pool } from 'pg';
import { getFileHashes } from './getFileHashes';
import { DatabaseConfig } from '../../types';
import { DB_CONFIG } from '../../config';
import { SCHEMA } from '../../schema';
import { DESCRIBE_CASES } from '../test';

jest.mock('../../config', () => ({
  DB_CONFIG: {
    host: 'localhost',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'password',
  },
}));

jest.mock('pg', () => ({
  Pool: jest.fn(),
}));

jest.mock('../../schema', () => ({
  SCHEMA: {
    GET_FILE_HASHES_QUERY: 'SELECT uid, slug, file_hash, source_commit_sha FROM articles WHERE file_hash IS NOT NULL',
  },
}));

describe('Unit/helpers/function/getFileHashes', () => {
  const mockClient = {
    query: jest.fn(),
    release: jest.fn(),
  };

  const mockPoolInstance = {
    connect: jest.fn(),
    end: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient.query.mockReset();
    mockClient.release.mockReset();
    mockPoolInstance.connect.mockResolvedValue(mockClient);
    mockPoolInstance.end.mockResolvedValue(undefined);
    (Pool as jest.MockedClass<typeof Pool>).mockImplementation(() => mockPoolInstance as any);
  });

  describe(DESCRIBE_CASES.SUCCESS, () => {
    it('Должна вернуть Map с хешами файлов при успешном запросе', async () => {
      const mockRows = [
        { slug: 'react-hooks', file_hash: 'abc123hash1', source_commit_sha: 'sha1' },
        { slug: 'typescript-basics', file_hash: 'def456hash2', source_commit_sha: 'sha2' },
        { slug: 'nodejs-api', file_hash: 'ghi789hash3', source_commit_sha: 'sha3' },
      ];

      mockClient.query.mockResolvedValue({ rows: mockRows });

      const result = await getFileHashes();

      expect(Pool).toHaveBeenCalledWith(DB_CONFIG);
      expect(mockPoolInstance.connect).toHaveBeenCalled();
      expect(mockClient.query).toHaveBeenCalledWith(SCHEMA.GET_FILE_HASHES_QUERY);
      expect(mockClient.release).toHaveBeenCalled();
      expect(mockPoolInstance.end).toHaveBeenCalled();

      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(3);
      expect(result.get('react-hooks')).toBe('abc123hash1:::sha1');
      expect(result.get('typescript-basics')).toBe('def456hash2:::sha2');
      expect(result.get('nodejs-api')).toBe('ghi789hash3:::sha3');
    });

    it('Должна вернуть пустой Map когда нет хешей в базе', async () => {
      mockClient.query.mockResolvedValue({ rows: [] });

      const result = await getFileHashes();

      expect(mockClient.query).toHaveBeenCalledWith(SCHEMA.GET_FILE_HASHES_QUERY);
      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(0);
    });

    it('Должна использовать кастомную конфигурацию базы данных', async () => {
      const customConfig: DatabaseConfig = {
        host: 'custom-host',
        port: 5433,
        database: 'custom-db',
        user: 'custom-user',
        password: 'custom-password',
      };

      mockClient.query.mockResolvedValue({ rows: [] });

      await getFileHashes(customConfig);

      expect(Pool).toHaveBeenCalledWith(customConfig);
      expect(Pool).not.toHaveBeenCalledWith(DB_CONFIG);
    });

    it('Должна использовать дефолтную конфигурацию когда config не передан', async () => {
      mockClient.query.mockResolvedValue({ rows: [] });

      await getFileHashes();

      expect(Pool).toHaveBeenCalledWith(DB_CONFIG);
    });

    it('Должна корректно обрабатывать один хеш', async () => {
      const mockRows = [{ slug: 'single-article', file_hash: 'single123hash', source_commit_sha: 'sha-single' }];

      mockClient.query.mockResolvedValue({ rows: mockRows });

      const result = await getFileHashes();

      expect(result.size).toBe(1);
      expect(result.get('single-article')).toBe('single123hash:::sha-single');
    });
  });

  describe(DESCRIBE_CASES.EDGE, () => {
    it('Должна корректно обрабатывать хеши с очень длинными значениями', async () => {
      const longHash = 'a'.repeat(1000);
      const mockRows = [{ slug: 'long-hash-article', file_hash: longHash, source_commit_sha: 'sha-long' }];

      mockClient.query.mockResolvedValue({ rows: mockRows });

      const result = await getFileHashes();

      expect(result.get('long-hash-article')).toBe(`${longHash}:::sha-long`);
      expect(result.get('long-hash-article')).toHaveLength(1011);
    });

    it('Должна корректно обрабатывать хеши с специальными символами', async () => {
      const specialHash = 'abc123!@#$%^&*()_+-=[]{}|;:,.<>?';
      const mockRows = [{ slug: 'special-chars', file_hash: specialHash, source_commit_sha: 'sha-special' }];

      mockClient.query.mockResolvedValue({ rows: mockRows });

      const result = await getFileHashes();

      expect(result.get('special-chars')).toBe(`${specialHash}:::sha-special`);
    });

    it('Должна корректно обрабатывать slug с дефисами и подчеркиваниями', async () => {
      const mockRows = [
        { slug: 'react-hooks-guide', file_hash: 'hash1', source_commit_sha: 'sha1' },
        { slug: 'typescript_basics', file_hash: 'hash2', source_commit_sha: 'sha2' },
        { slug: 'node.js-api', file_hash: 'hash3', source_commit_sha: 'sha3' },
      ];

      mockClient.query.mockResolvedValue({ rows: mockRows });

      const result = await getFileHashes();

      expect(result.get('react-hooks-guide')).toBe('hash1:::sha1');
      expect(result.get('typescript_basics')).toBe('hash2:::sha2');
      expect(result.get('node.js-api')).toBe('hash3:::sha3');
    });
  });

  describe(DESCRIBE_CASES.ERROR, () => {
    it('Должна вернуть пустой Map при ошибке выполнения запроса', async () => {
      const queryError = new Error('Query failed');
      mockClient.query.mockRejectedValue(queryError);

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await getFileHashes();

      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(0);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Ошибка при получении хешей файлов:', queryError);

      consoleErrorSpy.mockRestore();
    });

    it('Должна корректно освобождать ресурсы при ошибке', async () => {
      const queryError = new Error('Query failed');
      mockClient.query.mockRejectedValue(queryError);

      await getFileHashes();

      expect(mockClient.release).toHaveBeenCalled();
      expect(mockPoolInstance.end).toHaveBeenCalled();
    });
  });
});
