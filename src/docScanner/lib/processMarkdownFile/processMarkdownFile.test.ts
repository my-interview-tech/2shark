import { processMarkdownContent, processMarkdownFile } from './processMarkdownFile';
import { DESCRIBE_CASES } from '../../../helpers/test';
import { ChapterMapping, TechnologyMapping } from '../../../types';

jest.mock('fs/promises', () => ({
  readFile: jest.fn(),
}));

jest.mock('gray-matter', () => jest.fn());

const mockFs = require('fs/promises') as jest.Mocked<typeof import('fs/promises')>;
const mockMatter = require('gray-matter') as jest.MockedFunction<typeof import('gray-matter')>;

const mockTechnologyMapping: TechnologyMapping = {
  React: {
    specialty: 'Frontend',
    priority: 1,
    description: 'React framework',
  },
};

const mockSpecialtyMapping = {
  Frontend: { priority: 1, description: 'Frontend development' },
};

const mockChapterMapping: ChapterMapping = {
  'Подготовка к собеседованию': { title: 'Вопросы с собеседований', anchor: 'questions', order: 1, kind: 'question' },
  Задачи: { title: 'Задачи', anchor: 'tasks', order: 2, kind: 'task' },
};

const baseFrontmatter = {
  uid: 'uid-react-hooks',
  title: 'React Hooks',
  technology: 'React',
  specialty: 'Frontend',
  tools: ['React'],
  order: 10,
  access: 'public',
  created_at: '2025-01-01T00:00:00.000Z',
  updated_at: '2025-01-02T00:00:00.000Z',
  tags: ['react'],
  info: ['https://react.dev'],
};

function createMatterResult(data: Record<string, unknown>) {
  return {
    data,
    content: '# content',
    orig: '# content',
    language: '',
    matter: '---\n---',
    stringify: jest.fn(),
  } as unknown as ReturnType<typeof mockMatter>;
}

describe('Unit/utility/function/processMarkdownFile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFs.readFile.mockResolvedValue('# content');
    mockMatter.mockReturnValue(createMatterResult(baseFrontmatter));
  });

  describe(DESCRIBE_CASES.SUCCESS, () => {
    it('Должна использовать uid/access/tools/order и даты из frontmatter', async () => {
      const result = await processMarkdownFile({
        filePath: '/tmp/docs/react/hooks.md',
        technologyMapping: mockTechnologyMapping,
        specialtyMapping: mockSpecialtyMapping,
      });

      expect(result).toEqual({
        id: 'uid-react-hooks',
        uid: 'uid-react-hooks',
        title: 'React Hooks',
        content: '# content',
        specialty: 'Frontend',
        technology: 'React',
        priority: 1,
        description: 'React framework',
        tags: ['react'],
        info: ['https://react.dev'],
        links: [{ url: 'https://react.dev', title: null, image: null }],
        access: 'public',
        tools: ['React'],
        order: 10,
        kind: 'article',
        chapter: 'Материалы',
        chapterAnchor: 'materials',
        chapterOrder: 999,
        complexity: null,
        importance: null,
        context: null,
        file_hash: expect.any(String),
        created_at: new Date('2025-01-01T00:00:00.000Z'),
        updated_at: new Date('2025-01-02T00:00:00.000Z'),
      });
    });

    it('Должна разобрать поля экрана: kind, chapter, уровни, context и объектный info', () => {
      mockMatter.mockReturnValue(
        createMatterResult({
          ...baseFrontmatter,
          kind: 'question',
          chapter: 'Подготовка к собеседованию',
          complexity: 2,
          importance: 5,
          context: { caption: 'Хуки', result: ['Объяснить useEffect'] },
          info: ['https://react.dev', { url: 'https://habr.com/x', title: 'Хабр', image: 'https://habr.com/x.png' }],
        }),
      );

      const result = processMarkdownContent({
        filePath: 'docs/react/hooks.md',
        content: '# content',
        technologyMapping: mockTechnologyMapping,
        specialtyMapping: mockSpecialtyMapping,
        chapterMapping: mockChapterMapping,
      });

      expect(result).toMatchObject({
        kind: 'question',
        chapter: 'Вопросы с собеседований',
        chapterAnchor: 'questions',
        chapterOrder: 1,
        complexity: 2,
        importance: null,
        context: { caption: 'Хуки', result: ['Объяснить useEffect'] },
        info: ['https://react.dev', 'https://habr.com/x'],
        links: [
          { url: 'https://react.dev', title: null, image: null },
          { url: 'https://habr.com/x', title: 'Хабр', image: 'https://habr.com/x.png' },
        ],
      });
    });

    it('Должна взять kind из chapter, если во frontmatter его нет', () => {
      mockMatter.mockReturnValue(createMatterResult({ ...baseFrontmatter, chapter: 'Задачи' }));

      const result = processMarkdownContent({
        filePath: 'docs/react/task.md',
        content: '# content',
        technologyMapping: mockTechnologyMapping,
        specialtyMapping: mockSpecialtyMapping,
        chapterMapping: mockChapterMapping,
      });

      expect(result).toMatchObject({ kind: 'task', chapterAnchor: 'tasks' });
    });
  });

  describe(DESCRIBE_CASES.EDGE, () => {
    it('Должна пропускать draft документ', async () => {
      mockMatter.mockReturnValue(createMatterResult({ ...baseFrontmatter, draft: true }));

      const result = await processMarkdownFile({
        filePath: '/tmp/docs/react/draft.md',
        technologyMapping: mockTechnologyMapping,
        specialtyMapping: mockSpecialtyMapping,
      });

      expect(result).toBeNull();
    });
  });

  describe(DESCRIBE_CASES.ERROR, () => {
    it('Должна вернуть null если uid отсутствует', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockMatter.mockReturnValue(createMatterResult({ ...baseFrontmatter, uid: '' }));

      const result = await processMarkdownFile({
        filePath: '/tmp/docs/react/invalid.md',
        technologyMapping: mockTechnologyMapping,
        specialtyMapping: mockSpecialtyMapping,
      });

      expect(result).toBeNull();
      errorSpy.mockRestore();
    });

    it('Должна вернуть null если дата created_at невалидна', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockMatter.mockReturnValue(createMatterResult({ ...baseFrontmatter, created_at: 'not-a-date' }));

      const result = await processMarkdownFile({
        filePath: '/tmp/docs/react/invalid-date.md',
        technologyMapping: mockTechnologyMapping,
        specialtyMapping: mockSpecialtyMapping,
      });

      expect(result).toBeNull();
      errorSpy.mockRestore();
    });

    it('Должна вернуть null если tools не массив', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockMatter.mockReturnValue(createMatterResult({ ...baseFrontmatter, tools: 'React' }));

      const result = await processMarkdownFile({
        filePath: '/tmp/docs/react/invalid-tools.md',
        technologyMapping: mockTechnologyMapping,
        specialtyMapping: mockSpecialtyMapping,
      });

      expect(result).toBeNull();
      errorSpy.mockRestore();
    });

    it('Должна вернуть null если technology отсутствует в mapping', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockMatter.mockReturnValue(createMatterResult({ ...baseFrontmatter, technology: 'Unknown' }));

      const result = await processMarkdownFile({
        filePath: '/tmp/docs/react/invalid-tech.md',
        technologyMapping: mockTechnologyMapping,
        specialtyMapping: mockSpecialtyMapping,
      });

      expect(result).toBeNull();
      errorSpy.mockRestore();
    });

    it('Должна вернуть null если access отсутствует', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockMatter.mockReturnValue(createMatterResult({ ...baseFrontmatter, access: '' }));

      const result = await processMarkdownFile({
        filePath: '/tmp/docs/react/invalid-access.md',
        technologyMapping: mockTechnologyMapping,
        specialtyMapping: mockSpecialtyMapping,
      });

      expect(result).toBeNull();
      errorSpy.mockRestore();
    });

    it('Должна вернуть null если order не число', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockMatter.mockReturnValue(createMatterResult({ ...baseFrontmatter, order: '10' }));

      const result = await processMarkdownFile({
        filePath: '/tmp/docs/react/invalid-order.md',
        technologyMapping: mockTechnologyMapping,
        specialtyMapping: mockSpecialtyMapping,
      });

      expect(result).toBeNull();
      errorSpy.mockRestore();
    });

    it('Должна вернуть null если updated_at невалидна', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockMatter.mockReturnValue(createMatterResult({ ...baseFrontmatter, updated_at: 'invalid' }));

      const result = await processMarkdownFile({
        filePath: '/tmp/docs/react/invalid-updated-at.md',
        technologyMapping: mockTechnologyMapping,
        specialtyMapping: mockSpecialtyMapping,
      });

      expect(result).toBeNull();
      errorSpy.mockRestore();
    });

    it('Должна вернуть null если tools содержит не строку', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockMatter.mockReturnValue(createMatterResult({ ...baseFrontmatter, tools: ['React', 1] }));

      const result = await processMarkdownFile({
        filePath: '/tmp/docs/react/invalid-tools-types.md',
        technologyMapping: mockTechnologyMapping,
        specialtyMapping: mockSpecialtyMapping,
      });

      expect(result).toBeNull();
      errorSpy.mockRestore();
    });

    it('Должна вернуть null если kind неизвестен', () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockMatter.mockReturnValue(createMatterResult({ ...baseFrontmatter, kind: 'lesson' }));

      const result = processMarkdownContent({
        filePath: 'docs/react/invalid-kind.md',
        content: '# content',
        technologyMapping: mockTechnologyMapping,
        specialtyMapping: mockSpecialtyMapping,
      });

      expect(result).toBeNull();
      errorSpy.mockRestore();
    });

    it('Должна вернуть null если tags содержит не строку', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockMatter.mockReturnValue(createMatterResult({ ...baseFrontmatter, tags: ['react', 1] }));

      const result = await processMarkdownFile({
        filePath: '/tmp/docs/react/invalid-tags.md',
        technologyMapping: mockTechnologyMapping,
        specialtyMapping: mockSpecialtyMapping,
      });

      expect(result).toBeNull();
      errorSpy.mockRestore();
    });
  });
});
