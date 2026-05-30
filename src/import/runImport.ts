import { clearDatabase } from '../database';
import { loadYAMLContent, parseDatabase } from '../docScanner';
import { filterChangedFiles } from '../helpers';
import { readRevisionDocuments } from './git-source';
import { saveDocuments } from '../saveDocuments';
import { ScanOptions, SpecialtyMapping, TechnologyMapping, TRunImportOptions, TRunImportResult } from '../types';

const CATEGORY_MAPPING_FILE = 'category-mapping.yaml';
const SPECIALTIES_FILE = 'specialties.yaml';

function assertConfigLoaded(config: Record<string, unknown>, configPath: string): void {
  if (Object.keys(config).length === 0) {
    throw new Error(`Не удалось загрузить конфигурацию: ${configPath}`);
  }
}

export async function runImport(options: TRunImportOptions): Promise<TRunImportResult> {
  const {
    docsPath,
    configDir,
    repoPath,
    branch,
    commitSha,
    shouldCheckOnly = false,
    shouldForce = false,
    shouldClearBeforeImport = false,
  } = options;

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

  if ((branch && !commitSha) || (!branch && commitSha)) {
    throw new Error('Параметры branch и commitSha должны передаваться вместе');
  }

  if (shouldReadRevision && shouldClearBeforeImport) {
    throw new Error('Destructive clear запрещен для production revision import');
  }

  const documents = shouldReadRevision
    ? readRevisionDocuments({
        repoPath: repoPath || process.cwd(),
        docsPath,
        branch: branch as string,
        commitSha: commitSha as string,
        technologyMapping,
        specialtyMapping,
      })
    : await parseDatabase(scanOptions);
  const changedDocuments = shouldForce ? documents : await filterChangedFiles(documents);
  const skipped = documents.length - changedDocuments.length;

  if (shouldCheckOnly) {
    return {
      total: documents.length,
      changed: changedDocuments.length,
      skipped,
      saved: 0,
    };
  }

  if (shouldClearBeforeImport) {
    await clearDatabase();
  }

  if (changedDocuments.length > 0) {
    await saveDocuments({
      documents: changedDocuments,
      technologyMapping,
      specialtyMapping,
    });
  }

  return {
    total: documents.length,
    changed: changedDocuments.length,
    skipped,
    saved: changedDocuments.length,
  };
}
