import { filterChangedFiles } from './filterChangedFiles';
import { getFileHashes } from '../getFileHashes';
import { DocItem } from '../../types';
import { DESCRIBE_CASES } from '../test';

jest.mock('../getFileHashes');

const originalConsoleLog = console.log;
const originalConsoleError = console.error;

const mockDocuments: DocItem[] = [
  {
    id: 'react-hooks',
    uid: 'react-hooks',
    title: 'React Hooks Guide',
    content: '# React Hooks\n\nОсновы хуков в React...',
    specialty: 'Frontend',
    technology: 'React',
    access: 'public',
    tools: ['React'],
    order: 1,
    priority: 5,
    description: 'Руководство по хукам React',
    tags: ['react', 'hooks', 'frontend'],
    info: ['https://react.dev/hooks'],
    file_hash: 'abc123hash1',
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-15'),
  },
  {
    id: 'typescript-basics',
    uid: 'typescript-basics',
    title: 'TypeScript Basics',
    content: '# TypeScript\n\nОсновы TypeScript...',
    specialty: 'Frontend',
    technology: 'TypeScript',
    access: 'public',
    tools: ['TypeScript'],
    order: 2,
    priority: 3,
    description: 'Основы TypeScript',
    tags: ['typescript', 'frontend'],
    info: ['https://typescript.org'],
    file_hash: 'def456hash2',
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-15'),
  },
  {
    id: 'nodejs-api',
    uid: 'nodejs-api',
    title: 'Node.js API',
    content: '# Node.js API\n\nСоздание API на Node.js...',
    specialty: 'Backend',
    technology: 'Node.js',
    access: 'public',
    tools: ['Node.js'],
    order: 3,
    priority: 4,
    description: 'Создание API на Node.js',
    tags: ['nodejs', 'api', 'backend'],
    info: ['https://nodejs.org'],
    file_hash: 'ghi789hash3',
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-15'),
  },
];

beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});

const mockGetFileHashes = getFileHashes as jest.MockedFunction<typeof getFileHashes>;

describe('Unit/helpers/function/filterChangedFiles', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetFileHashes.mockResolvedValue(new Map());
  });

  describe(DESCRIBE_CASES.SUCCESS, () => {
    it('Должна вернуть все документы когда база данных пуста', async () => {
      mockGetFileHashes.mockResolvedValue(new Map());

      const result = await filterChangedFiles(mockDocuments);

      expect(result).toEqual(mockDocuments);
      expect(mockGetFileHashes).toHaveBeenCalledTimes(1);
    });

    it('Должна вернуть только новые документы', async () => {
      const existingHashes = new Map([
        ['other-doc-hash1', 'oldhash1'],
        ['other-doc-hash2', 'oldhash2'],
      ]);
      mockGetFileHashes.mockResolvedValue(existingHashes);

      const result = await filterChangedFiles(mockDocuments);

      expect(result).toEqual(mockDocuments);
      expect(result).toHaveLength(3);
    });

    it('Должна вернуть только измененные документы', async () => {
      const existingHashes = new Map([
        ['react-hooks-hash1', 'oldhash1'], // измененный хеш
        ['typescript-basics-hash2', 'def456hash2'], // неизмененный хеш
        ['nodejs-api-hash3', 'oldhash3'], // измененный хеш
      ]);
      mockGetFileHashes.mockResolvedValue(existingHashes);

      const result = await filterChangedFiles(mockDocuments);

      expect(result).toHaveLength(2);
      expect(result).toEqual([
        mockDocuments[0], // react-hooks (изменен)
        mockDocuments[2], // nodejs-api (изменен)
      ]);
    });

    it('Должна вернуть пустой массив когда все документы неизменены', async () => {
      const existingHashes = new Map([
        ['react-hooks-hash1', 'abc123hash1'],
        ['typescript-basics-hash2', 'def456hash2'],
        ['nodejs-api-hash3', 'ghi789hash3'],
      ]);
      mockGetFileHashes.mockResolvedValue(existingHashes);

      const result = await filterChangedFiles(mockDocuments);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('Должна корректно обрабатывать частичные совпадения slug', async () => {
      const existingHashes = new Map([
        ['react-hooks-some-suffix', 'abc123hash1'],
        ['typescript-basics-other-suffix', 'oldhash'],
      ]);
      mockGetFileHashes.mockResolvedValue(existingHashes);

      const result = await filterChangedFiles(mockDocuments);

      expect(result).toHaveLength(2);
      expect(result).toEqual([
        mockDocuments[1],
        mockDocuments[2],
      ]);
    });
  });

  describe(DESCRIBE_CASES.EDGE, () => {
    it('Должна вернуть пустой массив для пустого входного массива', async () => {
      mockGetFileHashes.mockResolvedValue(new Map());

      const result = await filterChangedFiles([]);

      expect(result).toEqual([]);
    });

    it('Должна корректно обрабатывать документы с одинаковыми хешами', async () => {
      const documentsWithSameHash = [
        { ...mockDocuments[0], file_hash: 'samehash' },
        { ...mockDocuments[1], file_hash: 'samehash' },
      ];
      const existingHashes = new Map([
        ['react-hooks-hash1', 'samehash'],
        ['typescript-basics-hash2', 'differenthash'],
      ]);
      mockGetFileHashes.mockResolvedValue(existingHashes);

      const result = await filterChangedFiles(documentsWithSameHash);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('typescript-basics');
    });

    it('Должна обрабатывать документы с очень длинными хешами', async () => {
      const longHash = 'a'.repeat(1000);
      const documentsWithLongHash = [{ ...mockDocuments[0], file_hash: longHash }];
      const existingHashes = new Map([['react-hooks-hash1', 'differenthash']]);
      mockGetFileHashes.mockResolvedValue(existingHashes);

      const result = await filterChangedFiles(documentsWithLongHash);

      expect(result).toHaveLength(1);
      expect(result[0].file_hash).toBe(longHash);
    });
  });

  describe(DESCRIBE_CASES.ERROR, () => {
    it('Должна вернуть все документы при ошибке получения хешей', async () => {
      mockGetFileHashes.mockRejectedValue(new Error('Database connection failed'));

      const result = await filterChangedFiles(mockDocuments);

      expect(result).toEqual(mockDocuments);
    });

    it('Должна обрабатывать ошибку и логировать её', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockGetFileHashes.mockRejectedValue(new Error('Test error'));

      const result = await filterChangedFiles(mockDocuments);

      expect(result).toEqual(mockDocuments);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Ошибка при фильтрации измененных файлов:', expect.any(Error));

      consoleErrorSpy.mockRestore();
    });

    it('Должна корректно обрабатывать null/undefined в хешах', async () => {
      const existingHashes = new Map([
        ['react-hooks-hash1', null as any],
        ['typescript-basics-hash2', undefined as any],
      ]);
      mockGetFileHashes.mockResolvedValue(existingHashes);

      const result = await filterChangedFiles(mockDocuments);

      expect(result).toEqual(mockDocuments);
    });
  });
});
