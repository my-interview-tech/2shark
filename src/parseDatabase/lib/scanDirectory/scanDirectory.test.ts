import { scanDirectory } from './scanDirectory';
import { DocItem, CategoryMapping } from '../../../types';
import { processMarkdownFile } from '../processMarkdownFile';

jest.mock('fs/promises', () => ({
  readdir: jest.fn(),
}));

jest.mock('path', () => ({
  join: jest.fn(),
}));

jest.mock('../processMarkdownFile', () => ({
  processMarkdownFile: jest.fn(),
}));

const mockFs = require('fs/promises') as jest.Mocked<typeof import('fs/promises')>;
const mockPath = require('path') as jest.Mocked<typeof import('path')>;
const mockProcessMarkdownFile = processMarkdownFile as jest.MockedFunction<typeof processMarkdownFile>;

const mockCategoryMapping: CategoryMapping = {
  react: {
    specialty: 'Frontend',
    priority: 1,
    description: 'React framework',
  },
};

const mockDocItem: DocItem = {
  id: 'test-doc',
  title: 'Test Document',
  content: '# Test\n\nContent...',
  specialty: 'Test',
  technology: 'test',
  priority: 1,
  description: 'Test description',
  tags: ['test'],
  created_at: new Date(),
  updated_at: new Date(),
};

describe('Unit/utility/function/scanDirectory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPath.join.mockImplementation((...args) => args.join('/'));
  });

  describe('SUCCESS_CASES', () => {
    it('должен обработать директорию с Markdown файлами', async () => {
      const dirPath = '/test/docs';
      const items: DocItem[] = [];

      mockFs.readdir.mockResolvedValue([
        { name: 'hooks.md', isDirectory: () => false, isFile: () => true } as any,
        { name: 'typescript.md', isDirectory: () => false, isFile: () => true } as any,
      ]);

      mockProcessMarkdownFile
        .mockResolvedValueOnce(mockDocItem)
        .mockResolvedValueOnce({ ...mockDocItem, id: 'typescript-doc' });

      await scanDirectory({ dirPath, items, categoryMapping: mockCategoryMapping });

      expect(mockFs.readdir).toHaveBeenCalledWith(dirPath, { withFileTypes: true });
      expect(mockProcessMarkdownFile).toHaveBeenCalledTimes(2);
      expect(items).toHaveLength(2);
    });

    it('должен обработать директорию с вложенными папками', async () => {
      const dirPath = '/test/docs';
      const items: DocItem[] = [];

      mockFs.readdir
        .mockResolvedValueOnce([
          { name: 'react', isDirectory: () => true, isFile: () => false } as any,
          { name: 'hooks.md', isDirectory: () => false, isFile: () => true } as any,
        ])
        .mockResolvedValueOnce([{ name: 'useState.md', isDirectory: () => false, isFile: () => true } as any]);

      mockProcessMarkdownFile
        .mockResolvedValueOnce(mockDocItem)
        .mockResolvedValueOnce({ ...mockDocItem, id: 'usestate-doc' });

      await scanDirectory({ dirPath, items, categoryMapping: mockCategoryMapping });

      expect(mockFs.readdir).toHaveBeenCalledTimes(2);
      expect(mockProcessMarkdownFile).toHaveBeenCalledTimes(2);
      expect(items).toHaveLength(2);
    });
  });

  describe('EDGE_CASES', () => {
    it('должен игнорировать файлы не .md', async () => {
      const dirPath = '/test/docs';
      const items: DocItem[] = [];

      mockFs.readdir.mockResolvedValue([
        { name: 'readme.txt', isDirectory: () => false, isFile: () => true } as any,
        { name: 'config.json', isDirectory: () => false, isFile: () => true } as any,
      ]);

      await scanDirectory({ dirPath, items, categoryMapping: mockCategoryMapping });

      expect(mockProcessMarkdownFile).not.toHaveBeenCalled();
      expect(items).toHaveLength(0);
    });

    it('должен обработать пустую директорию', async () => {
      const dirPath = '/test/empty';
      const items: DocItem[] = [];

      mockFs.readdir.mockResolvedValue([]);

      await scanDirectory({ dirPath, items, categoryMapping: mockCategoryMapping });

      expect(mockProcessMarkdownFile).not.toHaveBeenCalled();
      expect(items).toHaveLength(0);
    });

    it('должен обработать директорию со смешанными типами файлов', async () => {
      const dirPath = '/test/docs';
      const items: DocItem[] = [];

      mockFs.readdir.mockResolvedValue([
        { name: 'hooks.md', isDirectory: () => false, isFile: () => true } as any,
        { name: 'readme.txt', isDirectory: () => false, isFile: () => true } as any,
        { name: 'typescript.md', isDirectory: () => false, isFile: () => true } as any,
        { name: 'config.json', isDirectory: () => false, isFile: () => true } as any,
      ]);

      mockProcessMarkdownFile
        .mockResolvedValueOnce(mockDocItem)
        .mockResolvedValueOnce({ ...mockDocItem, id: 'typescript-doc' });

      await scanDirectory({ dirPath, items, categoryMapping: mockCategoryMapping });

      expect(mockProcessMarkdownFile).toHaveBeenCalledTimes(2);
      expect(items).toHaveLength(2);
    });
  });

  describe('ERROR_CASES', () => {
    it('должен обработать ошибку при чтении директории', async () => {
      const dirPath = '/test/docs';
      const items: DocItem[] = [];

      mockFs.readdir.mockRejectedValue(new Error('Permission denied'));

      await expect(scanDirectory({ dirPath, items, categoryMapping: mockCategoryMapping })).rejects.toThrow(
        'Permission denied',
      );
    });

    it('должен обработать ошибку при обработке файла', async () => {
      const dirPath = '/test/docs';
      const items: DocItem[] = [];

      mockFs.readdir.mockResolvedValue([{ name: 'hooks.md', isDirectory: () => false, isFile: () => true } as any]);

      mockProcessMarkdownFile.mockResolvedValue(null);

      await scanDirectory({ dirPath, items, categoryMapping: mockCategoryMapping });

      expect(mockProcessMarkdownFile).toHaveBeenCalledTimes(1);
      expect(items).toHaveLength(0);
    });

    it('должен обработать ошибку при обработке части файлов', async () => {
      const dirPath = '/test/docs';
      const items: DocItem[] = [];

      mockFs.readdir.mockResolvedValue([
        { name: 'hooks.md', isDirectory: () => false, isFile: () => true } as any,
        { name: 'typescript.md', isDirectory: () => false, isFile: () => true } as any,
        { name: 'react.md', isDirectory: () => false, isFile: () => true } as any,
      ]);

      mockProcessMarkdownFile
        .mockResolvedValueOnce(mockDocItem)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ ...mockDocItem, id: 'react-doc' });

      await scanDirectory({ dirPath, items, categoryMapping: mockCategoryMapping });

      expect(mockProcessMarkdownFile).toHaveBeenCalledTimes(3);
      expect(items).toHaveLength(2);
    });
  });
});
