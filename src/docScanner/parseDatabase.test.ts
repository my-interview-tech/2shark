import { parseDatabase } from './parseDatabase';
import { DocsScanner } from './class';
import { DocItem, ScanOptions } from '../types';
import { DEFAULT_OPTIONS } from './config';

jest.mock('./class/DocsScanner', () => ({
  DocsScanner: jest.fn(),
}));

const mockDocsScanner = DocsScanner as jest.MockedClass<typeof DocsScanner>;
const mockScanDocs = jest.fn();
const mockClose = jest.fn();

const mockDocItems: DocItem[] = [
  {
    id: 'react-hooks',
    title: 'React Hooks Guide',
    content: '# React Hooks\n\nОсновы хуков в React...',
    specialty: 'Frontend',
    technology: 'react',
    priority: 1,
    description: 'React framework',
    tags: ['react', 'hooks'],
    info: [],
    file_hash: 'react-hooks-hash',
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 'typescript-basics',
    title: 'TypeScript Basics',
    content: '# TypeScript Basics\n\nОсновы TypeScript...',
    specialty: 'Language',
    technology: 'typescript',
    priority: 2,
    description: 'TypeScript language',
    tags: ['typescript', 'javascript'],
    info: [],
    file_hash: 'typescript-basics-hash',
    created_at: new Date(),
    updated_at: new Date(),
  },
];

describe('Unit/utility/function/parseDatabase', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockScanDocs.mockResolvedValue(mockDocItems);
    mockClose.mockResolvedValue(undefined);

    mockDocsScanner.mockImplementation(
      (options) =>
        ({
          scanDocs: mockScanDocs,
          close: mockClose,
        } as any),
    );
  });

  describe('SUCCESS CASES', () => {
    it('должен сканировать документацию с дефолтными опциями', async () => {
      mockScanDocs.mockResolvedValue(mockDocItems);

      const result = await parseDatabase();

      expect(mockDocsScanner).toHaveBeenCalledWith(DEFAULT_OPTIONS);
      expect(mockScanDocs).toHaveBeenCalled();
      expect(mockClose).toHaveBeenCalled();

      expect(result).toEqual(mockDocItems);
    });

    it('должен сканировать документацию с кастомными опциями', async () => {
      const options: ScanOptions = {
        docsPath: './custom-docs',
        configPath: {
          technologyPath: './custom-config.yaml',
          specialtiesPath: './custom-specialties.yaml',
        },
      };

      mockScanDocs.mockResolvedValue(mockDocItems);

      const result = await parseDatabase(options);

      expect(mockDocsScanner).toHaveBeenCalledWith(options);
      expect(mockScanDocs).toHaveBeenCalled();
      expect(mockClose).toHaveBeenCalled();

      expect(result).toEqual(mockDocItems);
    });

    it('должен вернуть пустой массив при отсутствии документов', async () => {
      mockScanDocs.mockResolvedValue([]);

      const result = await parseDatabase();

      expect(mockDocsScanner).toHaveBeenCalledWith(DEFAULT_OPTIONS);
      expect(mockScanDocs).toHaveBeenCalled();
      expect(mockClose).toHaveBeenCalled();

      expect(result).toEqual([]);
    });
  });

  describe('EDGE CASES', () => {
    it('должен обработать пустые опции', async () => {
      mockScanDocs.mockClear();
      mockClose.mockClear();
      mockDocsScanner.mockClear();

      mockScanDocs.mockResolvedValue(mockDocItems);

      const result = await parseDatabase();

      expect(mockDocsScanner).toHaveBeenCalledWith(
        expect.objectContaining({
          docsPath: './docs',
          configPath: {
            technologyPath: './config/category-mapping.yaml',
            specialtiesPath: './config/specialties.yaml',
          },
        }),
      );
      expect(result).toEqual(mockDocItems);
    });

    it('должен обработать опции с undefined значениями', async () => {
      mockScanDocs.mockClear();
      mockClose.mockClear();
      mockDocsScanner.mockClear();

      const options: ScanOptions = {
        docsPath: './docs',
        configPath: {
          technologyPath: './config/category-mapping.yaml',
          specialtiesPath: './config/specialties.yaml',
        },
      };

      mockScanDocs.mockResolvedValue(mockDocItems);

      const result = await parseDatabase(options);

      expect(mockDocsScanner).toHaveBeenCalledWith(options);
      expect(result).toEqual(mockDocItems);
    });
  });

  describe('ERROR CASES', () => {
    it('должен вызвать close даже при ошибке в parseDatabase', async () => {
      const error = new Error('Scan error');
      mockScanDocs.mockRejectedValue(error);

      await expect(parseDatabase()).rejects.toThrow('Scan error');

      expect(mockDocsScanner).toHaveBeenCalledWith(
        expect.objectContaining({
          docsPath: './docs',
          configPath: {
            technologyPath: './config/category-mapping.yaml',
            specialtiesPath: './config/specialties.yaml',
          },
        }),
      );
      expect(mockScanDocs).toHaveBeenCalled();
      expect(mockClose).toHaveBeenCalled();
    });

    it('должен вызвать close даже при ошибке в close', async () => {
      mockScanDocs.mockResolvedValue(mockDocItems);
      mockClose.mockRejectedValue(new Error('Close error'));

      await expect(parseDatabase()).rejects.toThrow('Close error');

      expect(mockDocsScanner).toHaveBeenCalledWith(DEFAULT_OPTIONS);
      expect(mockScanDocs).toHaveBeenCalled();
      expect(mockClose).toHaveBeenCalled();
    });
  });

  describe('INTEGRATION TESTS', () => {
    it('должен корректно обработать полный workflow', async () => {
      mockScanDocs.mockClear();
      mockClose.mockClear();
      mockDocsScanner.mockClear();

      const options: ScanOptions = {
        docsPath: './docs',
        configPath: {
          technologyPath: './config/category-mapping.yaml',
          specialtiesPath: './config/specialties.yaml',
        },
        databaseUrl: 'postgresql://user:pass@localhost:5432/db',
        clearBeforeScan: false,
      };
      mockScanDocs.mockResolvedValue(mockDocItems);

      const result = await parseDatabase(options);

      expect(mockDocsScanner).toHaveBeenCalledWith(options);
      expect(mockScanDocs).toHaveBeenCalledTimes(1);
      expect(mockClose).toHaveBeenCalledTimes(1);

      expect(result).toEqual(mockDocItems);
    });
  });
});
