import { runImport } from './runImport';
import { clearDatabase } from '../database';
import { loadYAMLContent, parseDatabase } from '../docScanner';
import { filterChangedFiles } from '../helpers';
import { saveDocuments } from '../saveDocuments';
import { DESCRIBE_CASES } from '../helpers/test';
import { DocItem } from '../types';

jest.mock('../database', () => ({
  clearDatabase: jest.fn(),
}));

jest.mock('../docScanner', () => ({
  parseDatabase: jest.fn(),
  loadYAMLContent: jest.fn(),
}));

jest.mock('../helpers', () => ({
  filterChangedFiles: jest.fn(),
}));

jest.mock('../saveDocuments', () => ({
  saveDocuments: jest.fn(),
}));

const mockDocuments: DocItem[] = [
  {
    id: 'uid-1',
    uid: 'uid-1',
    title: 'Doc 1',
    content: '# doc',
    specialty: 'Frontend',
    technology: 'React',
    access: 'public',
    tools: ['React'],
    order: 1,
    priority: 1,
    description: 'd1',
    tags: [],
    info: [],
    file_hash: 'h1',
    created_at: new Date('2025-01-01T00:00:00.000Z'),
    updated_at: new Date('2025-01-02T00:00:00.000Z'),
  },
  {
    id: 'uid-2',
    uid: 'uid-2',
    title: 'Doc 2',
    content: '# doc2',
    specialty: 'Frontend',
    technology: 'React',
    access: 'public',
    tools: ['React'],
    order: 2,
    priority: 1,
    description: 'd2',
    tags: [],
    info: [],
    file_hash: 'h2',
    created_at: new Date('2025-01-01T00:00:00.000Z'),
    updated_at: new Date('2025-01-02T00:00:00.000Z'),
  },
];

describe('Unit/import/function/runImport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (loadYAMLContent as jest.MockedFunction<typeof loadYAMLContent>).mockImplementation((path: string) => {
      if (path.includes('category-mapping.yaml')) {
        return { React: { specialty: 'Frontend', priority: 1, description: 'React' } } as ReturnType<
          typeof loadYAMLContent
        >;
      }

      return { Frontend: { priority: 1, description: 'Frontend' } } as ReturnType<typeof loadYAMLContent>;
    });
    (parseDatabase as jest.MockedFunction<typeof parseDatabase>).mockResolvedValue(mockDocuments);
    (filterChangedFiles as jest.MockedFunction<typeof filterChangedFiles>).mockResolvedValue([mockDocuments[0]]);
  });

  describe(DESCRIBE_CASES.SUCCESS, () => {
    it('Должна вернуть summary в режиме check-only без записи', async () => {
      const result = await runImport({
        docsPath: './docs',
        configDir: './config',
        shouldCheckOnly: true,
      });

      expect(result).toEqual({
        total: 2,
        changed: 1,
        skipped: 1,
        saved: 0,
      });
      expect(saveDocuments).not.toHaveBeenCalled();
    });

    it('Должна сохранить changed документы и вернуть summary', async () => {
      const result = await runImport({
        docsPath: './docs',
        configDir: './config',
      });

      expect(saveDocuments).toHaveBeenCalledWith(
        expect.objectContaining({
          documents: [mockDocuments[0]],
        }),
      );
      expect(result).toEqual({
        total: 2,
        changed: 1,
        skipped: 1,
        saved: 1,
      });
    });
  });

  describe(DESCRIBE_CASES.EDGE, () => {
    it('Должна использовать force и сохранять все документы', async () => {
      const result = await runImport({
        docsPath: './docs',
        configDir: './config',
        shouldForce: true,
      });

      expect(filterChangedFiles).not.toHaveBeenCalled();
      expect(saveDocuments).toHaveBeenCalledWith(
        expect.objectContaining({
          documents: mockDocuments,
        }),
      );
      expect(result.saved).toBe(2);
    });

    it('Должна очистить БД перед сохранением если включен clear', async () => {
      await runImport({
        docsPath: './docs',
        configDir: './config',
        shouldClearBeforeImport: true,
      });

      expect(clearDatabase).toHaveBeenCalledTimes(1);
    });

    it('Должна не вызывать saveDocuments если нет changed документов', async () => {
      (filterChangedFiles as jest.MockedFunction<typeof filterChangedFiles>).mockResolvedValue([]);

      const result = await runImport({
        docsPath: './docs',
        configDir: './config',
      });

      expect(saveDocuments).not.toHaveBeenCalled();
      expect(result.saved).toBe(0);
    });
  });

  describe(DESCRIBE_CASES.ERROR, () => {
    it('Должна вернуть ошибку при пустом category mapping', async () => {
      (loadYAMLContent as jest.MockedFunction<typeof loadYAMLContent>).mockImplementation((path: string) => {
        if (path.includes('category-mapping.yaml')) {
          return {} as ReturnType<typeof loadYAMLContent>;
        }

        return { Frontend: { priority: 1, description: 'Frontend' } } as ReturnType<typeof loadYAMLContent>;
      });

      await expect(
        runImport({
          docsPath: './docs',
          configDir: './config',
        }),
      ).rejects.toThrow('Не удалось загрузить конфигурацию');
    });
  });
});
