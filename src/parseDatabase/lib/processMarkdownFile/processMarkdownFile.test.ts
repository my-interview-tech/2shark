import { processMarkdownFile } from './processMarkdownFile';
import { slugify } from '../slugify';
import { DocItem, CategoryMapping } from '../../../types';

jest.mock('fs/promises', () => ({
  readFile: jest.fn(),
}));

jest.mock('gray-matter', () => jest.fn());

jest.mock('path', () => ({
  relative: jest.fn(),
  dirname: jest.fn(),
  sep: '/',
  basename: jest.fn(),
}));

jest.mock('../slugify', () => ({
  slugify: jest.fn(),
}));

const mockFs = require('fs/promises') as jest.Mocked<typeof import('fs/promises')>;
const mockMatter = require('gray-matter') as jest.MockedFunction<typeof import('gray-matter')>;
const mockPath = require('path') as jest.Mocked<typeof import('path')>;
const mockSlugify = slugify as jest.MockedFunction<typeof slugify>;

function createMatterMock(data: any, content: string) {
  return {
    data,
    content,
    orig: content,
    language: '',
    matter: '---\n---',
    stringify: jest.fn(),
  };
}

const mockCategoryMapping: CategoryMapping = {
  react: {
    specialty: 'Frontend',
    priority: 1,
    description: 'React framework',
  },
  typescript: {
    specialty: 'Language',
    priority: 2,
    description: 'TypeScript language',
  },
};

describe('Unit/utility/function/processMarkdownFile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPath.relative.mockReturnValue('docs/react/hooks.md');
    mockPath.dirname.mockReturnValue('docs/react');
    mockPath.basename.mockReturnValue('hooks');
    mockSlugify.mockReturnValue('hooks');
    mockMatter.mockReturnValue(
      createMatterMock(
        { title: 'React Hooks Guide', tags: ['react', 'hooks'] },
        '# React Hooks\n\nОсновы хуков в React...',
      ),
    );
    mockFs.readFile.mockResolvedValue('# React Hooks\n\nОсновы хуков в React...');
  });

  describe('SUCCESS_CASES', () => {
    it('должен обработать Markdown файл с frontmatter', async () => {
      const filePath = '/test/docs/react/hooks.md';

      const expectedDocItem: DocItem = {
        id: 'hooks',
        title: 'React Hooks Guide',
        content: '# React Hooks\n\nОсновы хуков в React...',
        specialty: 'Frontend',
        technology: 'react',
        priority: 1,
        description: 'React framework',
        tags: ['react', 'hooks'],
        created_at: expect.any(Date),
        updated_at: expect.any(Date),
      };

      const result = await processMarkdownFile(filePath, mockCategoryMapping);

      expect(mockFs.readFile).toHaveBeenCalledWith(filePath, 'utf-8');
      expect(mockMatter).toHaveBeenCalledWith('# React Hooks\n\nОсновы хуков в React...');
      expect(mockPath.relative).toHaveBeenCalledWith(process.cwd(), filePath);
      expect(mockPath.dirname).toHaveBeenCalledWith('docs/react/hooks.md');
      expect(mockPath.basename).toHaveBeenCalledWith(filePath, '.md');
      expect(result).toEqual(expectedDocItem);
    });

    it('должен обработать файл без frontmatter', async () => {
      mockPath.relative.mockClear();
      mockPath.dirname.mockClear();
      mockPath.basename.mockClear();
      mockMatter.mockClear();

      mockMatter.mockReturnValue(createMatterMock({}, '# Basic Guide\n\nContent...'));

      const filePath = '/test/docs/basic/guide.md';
      mockPath.basename.mockReturnValue('guide');
      mockPath.relative.mockReturnValue('docs/basic/guide.md');
      mockPath.dirname.mockReturnValue('docs/basic');

      const result = await processMarkdownFile(filePath, mockCategoryMapping);

      expect(result?.title).toBe('guide');
      expect(result?.tags).toEqual([]);
      expect(result?.specialty).toBe('docs');
      expect(result?.technology).toBe('basic');
    });

    it('должен обработать файл с массивом категорий', async () => {
      const mappingWithArray: CategoryMapping = {
        git: {
          specialty: ['Frontend', 'Backend'],
          priority: 1,
          description: 'Version control',
        },
      };

      mockPath.dirname.mockReturnValue('docs/git');
      mockPath.relative.mockReturnValue('docs/git/guide.md');

      const result = await processMarkdownFile('/test/docs/git/guide.md', mappingWithArray);

      expect(result?.specialty).toBe('Frontend');
    });

    it('должен обработать файл без маппинга категорий', async () => {
      mockPath.relative.mockClear();
      mockPath.dirname.mockClear();
      mockPath.basename.mockClear();
      mockMatter.mockClear();

      mockPath.dirname.mockReturnValue('docs/unknown');
      mockPath.relative.mockReturnValue('docs/unknown/guide.md');

      const result = await processMarkdownFile('/test/docs/unknown/guide.md', {});

      expect(result?.specialty).toBe('docs');
      expect(result?.technology).toBe('unknown');
      expect(result?.priority).toBe(0);
      expect(result?.description).toBe('');
    });
  });

  describe('EDGE_CASES', () => {
    it('должен обработать файл в корневой директории', async () => {
      mockPath.relative.mockReturnValue('guide.md');
      mockPath.dirname.mockReturnValue('');

      const result = await processMarkdownFile('/test/guide.md', mockCategoryMapping);

      expect(result?.specialty).toBe('');
      expect(result?.technology).toBe('');
    });

    it('должен обработать файл с пустым content', async () => {
      mockMatter.mockReturnValue(createMatterMock({ title: 'Empty File' }, ''));

      const result = await processMarkdownFile('/test/empty.md', mockCategoryMapping);

      expect(result?.content).toBe('');
      expect(result?.title).toBe('Empty File');
    });

    it('должен обработать файл с null/undefined в frontmatter', async () => {
      mockMatter.mockReturnValue(createMatterMock({ title: null, tags: undefined }, 'Content'));

      const result = await processMarkdownFile('/test/test.md', mockCategoryMapping);

      expect(result?.title).toBe('hooks');
      expect(result?.tags).toEqual([]);
    });
  });

  describe('ERROR_CASES', () => {
    it('должен вернуть null при ошибке чтения файла', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockFs.readFile.mockRejectedValue(new Error('ENOENT: no such file'));

      const result = await processMarkdownFile('/test/nonexistent.md', mockCategoryMapping);

      expect(consoleSpy).toHaveBeenCalledWith('Ошибка обработки файла /test/nonexistent.md:', expect.any(Error));
      expect(result).toBeNull();

      consoleSpy.mockRestore();
    });

    it('должен вернуть null при ошибке парсинга frontmatter', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockMatter.mockImplementation(() => {
        throw new Error('Invalid frontmatter');
      });

      const result = await processMarkdownFile('/test/docs/test.md', mockCategoryMapping);

      expect(consoleSpy).toHaveBeenCalledWith('Ошибка обработки файла /test/docs/test.md:', expect.any(Error));
      expect(result).toBeNull();

      consoleSpy.mockRestore();
    });

    it('должен вернуть null при ошибке обработки пути', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockPath.relative.mockImplementation(() => {
        throw new Error('Path error');
      });

      const result = await processMarkdownFile('/test/docs/test.md', mockCategoryMapping);

      expect(consoleSpy).toHaveBeenCalledWith('Ошибка обработки файла /test/docs/test.md:', expect.any(Error));
      expect(result).toBeNull();

      consoleSpy.mockRestore();
    });
  });

  describe('INTEGRATION_TESTS', () => {
    it('должен корректно обработать полный workflow', async () => {
      const filePath = '/test/docs/typescript/basics.md';
      const content = `---
title: TypeScript Basics
tags: [typescript, javascript, tutorial]
---

# TypeScript Basics

Основы TypeScript...
`;

      mockFs.readFile.mockResolvedValue(content);
      mockMatter.mockReturnValue(
        createMatterMock(
          { title: 'TypeScript Basics', tags: ['typescript', 'javascript', 'tutorial'] },
          '# TypeScript Basics\n\nОсновы TypeScript...',
        ),
      );
      mockPath.relative.mockReturnValue('docs/typescript/basics.md');
      mockPath.dirname.mockReturnValue('docs/typescript');
      mockPath.basename.mockReturnValue('basics');
      mockSlugify.mockReturnValue('basics');

      const result = await processMarkdownFile(filePath, mockCategoryMapping);

      expect(result).toEqual({
        id: 'basics',
        title: 'TypeScript Basics',
        content: '# TypeScript Basics\n\nОсновы TypeScript...',
        specialty: 'Language',
        technology: 'typescript',
        priority: 2,
        description: 'TypeScript language',
        tags: ['typescript', 'javascript', 'tutorial'],
        created_at: expect.any(Date),
        updated_at: expect.any(Date),
      });
    });
  });
});
