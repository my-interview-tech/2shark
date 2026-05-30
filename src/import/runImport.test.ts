import { runImport } from './runImport';
import { clearDatabase } from '../database';
import { loadYAMLContent, parseDatabase } from '../docScanner';
import { filterChangedFiles } from '../helpers';
import { saveDocuments } from '../saveDocuments';
import { readRevisionDocuments } from './git-source';
import { createImportJob, markImportJobFailed, markImportJobRunning, markImportJobSuccess } from './jobs';
import { reconcilePublishedRevision } from './reconcile';
import { DESCRIBE_CASES } from '../helpers/test';
import { DocItem } from '../types';
import { Pool } from 'pg';

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

jest.mock('./git-source', () => ({
  readRevisionDocuments: jest.fn(),
}));

jest.mock('./jobs', () => ({
  createImportJob: jest.fn(),
  markImportJobRunning: jest.fn(),
  markImportJobSuccess: jest.fn(),
  markImportJobFailed: jest.fn(),
}));

jest.mock('./reconcile', () => ({
  reconcilePublishedRevision: jest.fn(),
}));

jest.mock('pg', () => ({
  Pool: jest.fn(),
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
  const mockJobsClient = {
    release: jest.fn(),
  };
  const mockPoolInstance = {
    connect: jest.fn(),
    end: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (Pool as jest.MockedClass<typeof Pool>).mockImplementation(() => mockPoolInstance as any);
    mockPoolInstance.connect.mockResolvedValue(mockJobsClient as any);
    mockPoolInstance.end.mockResolvedValue(undefined);
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
    (readRevisionDocuments as jest.MockedFunction<typeof readRevisionDocuments>).mockReturnValue(mockDocuments);
    (createImportJob as jest.MockedFunction<typeof createImportJob>).mockResolvedValue('1');
    (reconcilePublishedRevision as jest.MockedFunction<typeof reconcilePublishedRevision>).mockResolvedValue(0);
    (saveDocuments as jest.MockedFunction<typeof saveDocuments>).mockImplementation(async (params: any) => {
      if (params.afterSave) {
        await params.afterSave({ client: mockJobsClient, importedUids: ['uid-1', 'uid-2'] });
      }
    });
  });

  describe(DESCRIBE_CASES.SUCCESS, () => {
    it('Должна вернуть summary в режиме check-only без записи', async () => {
      const result = await runImport({
        docsPath: './docs',
        configDir: './config',
        repoPath: '/tmp/repo',
        branch: 'main',
        commitSha: 'abc123',
        isProductionSync: true,
        shouldCheckOnly: true,
      });

      expect(result).toEqual({
        total: 2,
        changed: 1,
        skipped: 1,
        saved: 0,
      });
      expect(saveDocuments).not.toHaveBeenCalled();
      expect(markImportJobSuccess).toHaveBeenCalled();
      expect(reconcilePublishedRevision).not.toHaveBeenCalled();
    });

    it('Должна сохранить changed документы и вернуть summary', async () => {
      const result = await runImport({
        docsPath: './docs',
        configDir: './config',
        repoPath: '/tmp/repo',
        branch: 'main',
        commitSha: 'abc123',
        isProductionSync: true,
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
      expect(createImportJob).toHaveBeenCalledWith(expect.any(Object), {
        branch: 'main',
        commitSha: 'abc123',
      });
      expect(markImportJobRunning).toHaveBeenCalledWith(expect.any(Object), '1');
      expect(reconcilePublishedRevision).toHaveBeenCalledWith(expect.any(Object), {
        importJobId: '1',
        branch: 'main',
        commitSha: 'abc123',
        importedUids: ['uid-1', 'uid-2'],
      });
      expect(markImportJobSuccess).toHaveBeenCalledWith(expect.any(Object), '1', {
        total: 2,
        created: 0,
        updated: 1,
        skipped: 1,
        archived: 0,
      });
    });

    it('Должна записывать archived count в import job result', async () => {
      (reconcilePublishedRevision as jest.MockedFunction<typeof reconcilePublishedRevision>).mockResolvedValue(2);

      await runImport({
        docsPath: './docs',
        configDir: './config',
        repoPath: '/tmp/repo',
        branch: 'main',
        commitSha: 'abc123',
        isProductionSync: true,
      });

      expect(markImportJobSuccess).toHaveBeenCalledWith(expect.any(Object), '1', {
        total: 2,
        created: 0,
        updated: 1,
        skipped: 1,
        archived: 2,
      });
    });

    it('Должна читать документы из git revision при переданных branch и commitSha', async () => {
      await runImport({
        docsPath: './docs',
        configDir: './config',
        repoPath: '/tmp/repo',
        branch: 'main',
        commitSha: 'abc123',
        isProductionSync: true,
      });

      expect(readRevisionDocuments).toHaveBeenCalledWith(
        expect.objectContaining({
          repoPath: '/tmp/repo',
          branch: 'main',
          commitSha: 'abc123',
        }),
      );
      expect(parseDatabase).not.toHaveBeenCalled();
    });
  });

  describe(DESCRIBE_CASES.EDGE, () => {
    it('Должна использовать force и сохранять все документы', async () => {
      const result = await runImport({
        docsPath: './docs',
        configDir: './config',
        repoPath: '/tmp/repo',
        branch: 'main',
        commitSha: 'abc123',
        isProductionSync: true,
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

    it('Должна не вызывать saveDocuments если нет changed документов', async () => {
      (filterChangedFiles as jest.MockedFunction<typeof filterChangedFiles>).mockResolvedValue([]);

      const result = await runImport({
        docsPath: './docs',
        configDir: './config',
        repoPath: '/tmp/repo',
        branch: 'main',
        commitSha: 'abc123',
        isProductionSync: true,
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
          repoPath: '/tmp/repo',
          branch: 'main',
          commitSha: 'abc123',
          isProductionSync: true,
        }),
      ).rejects.toThrow('Не удалось загрузить конфигурацию');
      expect(markImportJobFailed).toHaveBeenCalled();
    });

    it('Должна вернуть ошибку если не переданы branch и commitSha', async () => {
      await expect(
        runImport({
          docsPath: './docs',
          configDir: './config',
          isProductionSync: true,
        }),
      ).rejects.toThrow('обязательны');
    });

    it('Должна вернуть ошибку при clear в revision import', async () => {
      await expect(
        runImport({
          docsPath: './docs',
          configDir: './config',
          branch: 'main',
          commitSha: 'abc123',
          isProductionSync: true,
          shouldClearBeforeImport: true,
        }),
      ).rejects.toThrow('Destructive clear запрещен');
      expect(clearDatabase).not.toHaveBeenCalled();
    });

    it('Должна вернуть ошибку в production sync режиме для не-main ветки', async () => {
      await expect(
        runImport({
          docsPath: './docs',
          configDir: './config',
          branch: 'master',
          commitSha: 'abc123',
          isProductionSync: true,
        }),
      ).rejects.toThrow('только для branch=main');
    });

    it('Должна вернуть ошибку и failed job при пустом imported uid set', async () => {
      (readRevisionDocuments as jest.MockedFunction<typeof readRevisionDocuments>).mockReturnValue([]);
      (filterChangedFiles as jest.MockedFunction<typeof filterChangedFiles>).mockResolvedValue([]);
      (reconcilePublishedRevision as jest.MockedFunction<typeof reconcilePublishedRevision>).mockRejectedValue(
        new Error('Пустой imported uid set запрещен для production archive reconcile'),
      );

      await expect(
        runImport({
          docsPath: './docs',
          configDir: './config',
          branch: 'main',
          commitSha: 'abc123',
          isProductionSync: true,
        }),
      ).rejects.toThrow('Пустой imported uid set запрещен');
      expect(markImportJobFailed).toHaveBeenCalled();
    });

    it('Должна пробрасывать исходную ошибку если сохранение failed job тоже упало', async () => {
      const sourceError = new Error('source import error');
      const failedSaveError = new Error('failed save error');
      (readRevisionDocuments as jest.MockedFunction<typeof readRevisionDocuments>).mockImplementation(() => {
        throw sourceError;
      });
      (markImportJobFailed as jest.MockedFunction<typeof markImportJobFailed>).mockRejectedValue(failedSaveError);

      await expect(
        runImport({
          docsPath: './docs',
          configDir: './config',
          repoPath: '/tmp/repo',
          branch: 'main',
          commitSha: 'abc123',
          isProductionSync: true,
        }),
      ).rejects.toThrow('source import error');
    });
  });
});
