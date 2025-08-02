import { DocsScanner } from './DocsScanner';
import { loadCategoryMapping, scanDirectory } from '../lib';

jest.mock('../lib/loadCategoryMapping/loadCategoryMapping');
jest.mock('../lib/scanDirectory/scanDirectory');

jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({
    end: jest.fn().mockResolvedValue(undefined),
  })),
}));
jest.mock('fs/promises', () => ({
  access: jest.fn(),
}));

const mockLoadCategoryMapping = loadCategoryMapping as jest.MockedFunction<typeof loadCategoryMapping>;
const mockScanDirectory = scanDirectory as jest.MockedFunction<typeof scanDirectory>;
const mockFsAccess = require('fs/promises').access as jest.MockedFunction<any>;

const mockCategoryMapping = {
  react: { specialty: 'Frontend', priority: 1, description: 'React framework' },
  typescript: { specialty: 'Frontend', priority: 2, description: 'TypeScript language' },
};

describe('Unit/class/DocsScanner', () => {
  let scanner: DocsScanner;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLoadCategoryMapping.mockReturnValue(mockCategoryMapping);
    mockFsAccess.mockResolvedValue(undefined);
    mockScanDirectory.mockResolvedValue(undefined);
  });

  describe('method/constructor', () => {
    it('должен создать экземпляр с дефолтными настройками', () => {
      scanner = new DocsScanner();

      expect(mockLoadCategoryMapping).toHaveBeenCalledWith({});
    });

    it('должен создать экземпляр с кастомными настройками', () => {
      const options = {
        docsPath: './custom-docs',
        configPath: './custom-config.yaml',
      };

      scanner = new DocsScanner(options);

      expect(mockLoadCategoryMapping).toHaveBeenCalledWith(options);
    });
  });

  describe('method/scanDocs', () => {
    beforeEach(() => {
      scanner = new DocsScanner();
    });

    it('должен сканировать документацию успешно', async () => {
      const mockItems = [
        {
          id: 'test-1',
          title: 'Test 1',
          content: 'Content 1',
          specialty: 'Test',
          technology: 'Unit',
          priority: 1,
          description: 'Test description',
          tags: ['test'],
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 'test-2',
          title: 'Test 2',
          content: 'Content 2',
          specialty: 'Test',
          technology: 'Unit',
          priority: 2,
          description: 'Test description 2',
          tags: ['test'],
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockScanDirectory.mockImplementation(async (params) => {
        const { items } = params;
        items.push(...mockItems);
      });

      const result = await scanner.scanDocs();

      expect(mockFsAccess).toHaveBeenCalledWith(expect.stringContaining('docs'));
      expect(mockScanDirectory).toHaveBeenCalledWith({
        dirPath: expect.stringContaining('docs'),
        items: expect.any(Array),
        categoryMapping: mockCategoryMapping,
      });
      expect(result).toEqual(mockItems);
    });

    it('должен использовать кастомный путь к документации', async () => {
      const customPath = './custom-docs';
      const mockItems = [
        {
          id: 'test',
          title: 'Test',
          content: 'Content',
          specialty: 'Test',
          technology: 'Unit',
          priority: 1,
          description: 'Test description',
          tags: ['test'],
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockScanDirectory.mockImplementation(async (params) => {
        const { items } = params;
        items.push(...mockItems);
      });

      const result = await scanner.scanDocs(customPath);

      expect(mockFsAccess).toHaveBeenCalledWith(customPath);
      expect(mockScanDirectory).toHaveBeenCalledWith({
        dirPath: customPath,
        items: expect.any(Array),
        categoryMapping: mockCategoryMapping,
      });
      expect(result).toEqual(mockItems);
    });

    it('должен использовать docsPath из options', async () => {
      const options = { docsPath: './options-docs' };
      scanner = new DocsScanner(options);
      const mockItems = [
        {
          id: 'test',
          title: 'Test',
          content: 'Content',
          specialty: 'Test',
          technology: 'Unit',
          priority: 1,
          description: 'Test description',
          tags: ['test'],
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockScanDirectory.mockImplementation(async (params) => {
        const { items } = params;
        items.push(...mockItems);
      });

      const result = await scanner.scanDocs();

      expect(mockFsAccess).toHaveBeenCalledWith('./options-docs');
      expect(mockScanDirectory).toHaveBeenCalledWith({
        dirPath: './options-docs',
        items: expect.any(Array),
        categoryMapping: mockCategoryMapping,
      });
      expect(result).toEqual(mockItems);
    });

    it('должен выбросить ошибку если директория не найдена', async () => {
      mockFsAccess.mockRejectedValue(new Error('ENOENT'));

      await expect(scanner.scanDocs()).rejects.toThrow('Директория');
    });
  });

  describe('method/close', () => {
    it('должен закрыть соединение с базой данных', async () => {
      scanner = new DocsScanner();

      await scanner.close();

      expect(scanner['pool'].end).toHaveBeenCalled();
    });
  });

  describe('INTEGRATION TESTS', () => {
    it('должен обработать полный цикл сканирования', async () => {
      const options = {
        docsPath: './test-docs',
        configPath: './test-config.yaml',
      };

      scanner = new DocsScanner(options);

      const mockItems = [
        {
          id: 'article-1',
          title: 'Article 1',
          content: 'Content 1',
          specialty: 'Test',
          technology: 'Unit',
          priority: 1,
          description: 'Test description',
          tags: ['test'],
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 'article-2',
          title: 'Article 2',
          content: 'Content 2',
          specialty: 'Test',
          technology: 'Unit',
          priority: 2,
          description: 'Test description 2',
          tags: ['test'],
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockScanDirectory.mockImplementation(async (params) => {
        const { items } = params;
        items.push(...mockItems);
      });

      const result = await scanner.scanDocs();
      await scanner.close();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('article-1');
      expect(result[1].id).toBe('article-2');

      expect(scanner['pool'].end).toHaveBeenCalled();
    });
  });
});
