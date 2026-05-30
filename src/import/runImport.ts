import { clearDatabase } from '../database';
import { DB_CONFIG } from '../config';
import { loadYAMLContent, parseDatabase } from '../docScanner';
import { filterChangedFiles } from '../helpers';
import { readRevisionDocuments } from './git-source';
import { createImportJob, markImportJobFailed, markImportJobRunning, markImportJobSuccess } from './jobs';
import { reconcilePublishedRevision } from './reconcile';
import { Pool } from 'pg';
import { saveDocuments } from '../saveDocuments';
import {
  ScanOptions,
  SpecialtyMapping,
  TechnologyMapping,
  TImportJobError,
  TImportJobResult,
  TRunImportOptions,
  TRunImportResult,
} from '../types';

const CATEGORY_MAPPING_FILE = 'category-mapping.yaml';
const SPECIALTIES_FILE = 'specialties.yaml';

function assertConfigLoaded(config: Record<string, unknown>, configPath: string): void {
  if (Object.keys(config).length === 0) {
    throw new Error(`Не удалось загрузить конфигурацию: ${configPath}`);
  }
}

function toImportJobError(error: unknown): TImportJobError {
  if (error instanceof Error) {
    const importError: TImportJobError = {
      message: error.message,
    };

    if ('code' in error && typeof error.code === 'string') {
      importError.code = error.code;
    }

    return importError;
  }

  return { message: String(error) };
}

export async function runImport(options: TRunImportOptions): Promise<TRunImportResult> {
  const {
    docsPath,
    configDir,
    repoPath,
    branch,
    commitSha,
    isProductionSync = false,
    shouldCheckOnly = false,
    shouldForce = false,
    shouldClearBeforeImport = false,
  } = options;
  if (!branch || !commitSha) {
    throw new Error('Параметры branch и commitSha обязательны для import job observability');
  }

  if (isProductionSync && branch !== 'main') {
    throw new Error('Production sync разрешен только для branch=main');
  }

  const jobsPool = new Pool(DB_CONFIG);
  const jobsClient = await jobsPool.connect();
  let importJobId: string | null = null;

  try {
    importJobId = await createImportJob(jobsClient, { branch, commitSha });
    await markImportJobRunning(jobsClient, importJobId);
    if (!importJobId) {
      throw new Error('Не удалось создать import job');
    }
    const currentImportJobId = importJobId;
    const scanOptions: ScanOptions = {
      docsPath,
      configPath: {
        technologyPath: `${configDir}/${CATEGORY_MAPPING_FILE}`,
        specialtiesPath: `${configDir}/${SPECIALTIES_FILE}`,
      },
    };

    const technologyMapping = loadYAMLContent<TechnologyMapping>(scanOptions.configPath.technologyPath);
    const specialtyMapping = loadYAMLContent<SpecialtyMapping>(scanOptions.configPath.specialtiesPath);
    assertConfigLoaded(technologyMapping, scanOptions.configPath.technologyPath);
    assertConfigLoaded(specialtyMapping, scanOptions.configPath.specialtiesPath);
    const shouldReadRevision = Boolean(branch && commitSha);

    if (shouldReadRevision && shouldClearBeforeImport) {
      throw new Error('Destructive clear запрещен для production revision import');
    }

    const documents = shouldReadRevision
      ? readRevisionDocuments({
          repoPath: repoPath || process.cwd(),
          docsPath,
          branch,
          commitSha,
          technologyMapping,
          specialtyMapping,
        })
      : await parseDatabase(scanOptions);
    const changedDocuments = shouldForce ? documents : await filterChangedFiles(documents);
    const skipped = documents.length - changedDocuments.length;

    if (shouldCheckOnly) {
      const checkOnlyResult: TRunImportResult = {
        total: documents.length,
        changed: changedDocuments.length,
        skipped,
        saved: 0,
      };
      const checkOnlyJobResult: TImportJobResult = {
        total: documents.length,
        created: 0,
        updated: 0,
        skipped,
        archived: 0,
      };
      await markImportJobSuccess(jobsClient, importJobId, checkOnlyJobResult);
      return checkOnlyResult;
    }

    if (shouldClearBeforeImport) {
      await clearDatabase();
    }

    let archivedCount = 0;
    if (changedDocuments.length > 0) {
      await saveDocuments({
        documents: changedDocuments,
        technologyMapping,
        specialtyMapping,
        afterSave: isProductionSync
          ? async ({ client }) => {
              archivedCount = await reconcilePublishedRevision(client, {
                importJobId: currentImportJobId,
                branch,
                commitSha,
                importedUids: documents.map((document) => document.uid),
              });
            }
          : undefined,
      });
    }

    if (isProductionSync && changedDocuments.length === 0) {
      archivedCount = await reconcilePublishedRevision(jobsClient, {
        importJobId: currentImportJobId,
        branch,
        commitSha,
        importedUids: documents.map((document) => document.uid),
      });
    }

    const importResult: TRunImportResult = {
      total: documents.length,
      changed: changedDocuments.length,
      skipped,
      saved: changedDocuments.length,
    };
    const importJobResult: TImportJobResult = {
      total: documents.length,
      created: 0,
      updated: changedDocuments.length,
      skipped,
      archived: archivedCount,
    };
    await markImportJobSuccess(jobsClient, currentImportJobId, importJobResult);

    return importResult;
  } catch (error) {
    if (importJobId) {
      try {
        await markImportJobFailed(jobsClient, importJobId, toImportJobError(error));
      } catch {
        // Не маскируем исходную ошибку импорта ошибкой сохранения job.
      }
    }

    throw error;
  } finally {
    jobsClient.release();
    await jobsPool.end();
  }
}
