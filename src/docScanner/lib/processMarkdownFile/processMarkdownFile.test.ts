import { processMarkdownFile } from './processMarkdownFile';
import { DESCRIBE_CASES } from '../../../helpers/test';
import { TechnologyMapping } from '../../../types';

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
        access: 'public',
        tools: ['React'],
        order: 10,
        file_hash: expect.any(String),
        created_at: new Date('2025-01-01T00:00:00.000Z'),
        updated_at: new Date('2025-01-02T00:00:00.000Z'),
      });
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
