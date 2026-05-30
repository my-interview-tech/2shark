import { execFileSync } from 'child_process';
import path from 'path';
import { processMarkdownContent } from '../../docScanner/lib/processMarkdownFile';
import { DocItem, SpecialtyMapping, TechnologyMapping } from '../../types';

type TReadRevisionDocumentsParams = {
  repoPath: string;
  docsPath: string;
  branch: string;
  commitSha: string;
  technologyMapping: TechnologyMapping;
  specialtyMapping: SpecialtyMapping;
};

/**
 * Выполняет git-команду в репозитории контента и возвращает trimmed stdout.
 *
 * @param repoPath - Путь к git-репозиторию.
 * @param args - Аргументы команды `git`.
 * @returns stdout команды без пробелов по краям.
 * @throws Если git завершился с ненулевым exit code.
 */
function runGitCommand(repoPath: string, args: string[]): string {
  return execFileSync('git', args, { cwd: repoPath, encoding: 'utf-8' }).trim();
}

/**
 * Приводит путь к markdown-директории к repo-relative формату для git plumbing команд.
 *
 * @param repoPath - Корень git-репозитория.
 * @param targetPath - Абсолютный или относительный путь к markdown-директории.
 * @returns Путь относительно `repoPath`.
 * @throws Если абсолютный путь находится вне репозитория.
 */
function toRepoRelativePath(repoPath: string, targetPath: string): string {
  if (!path.isAbsolute(targetPath)) {
    return targetPath.replace(/^\.\/+/, '');
  }

  const relativePath = path.relative(repoPath, targetPath);

  if (relativePath.startsWith('..')) {
    throw new Error(`Путь ${targetPath} находится вне репозитория ${repoPath}`);
  }

  return relativePath;
}

/**
 * Проверяет, что commit существует и принадлежит указанной ветке.
 *
 * @param repoPath - Путь к git-репозиторию.
 * @param branch - Ветка, в рамках которой разрешен импорт.
 * @param commitSha - Commit SHA markdown-ревизии.
 * @throws Если commit не найден или не является ancestor указанной ветки.
 */
function assertRevision(repoPath: string, branch: string, commitSha: string): void {
  try {
    runGitCommand(repoPath, ['rev-parse', '--verify', `${commitSha}^{commit}`]);
  } catch {
    throw new Error(`Commit SHA не найден: ${commitSha}`);
  }

  try {
    runGitCommand(repoPath, ['merge-base', '--is-ancestor', commitSha, branch]);
  } catch {
    throw new Error(`Commit ${commitSha} не принадлежит ветке ${branch}`);
  }
}

/**
 * Возвращает список markdown-файлов в указанной директории на конкретном commit.
 *
 * @param repoPath - Путь к git-репозиторию.
 * @param commitSha - Commit SHA markdown-ревизии.
 * @param docsRelativePath - Путь к docs-директории относительно репозитория.
 * @returns Repo-relative пути `.md` файлов.
 */
function listMarkdownFiles(repoPath: string, commitSha: string, docsRelativePath: string): string[] {
  const output = runGitCommand(repoPath, ['ls-tree', '-r', '--name-only', commitSha, '--', docsRelativePath]);

  if (!output) {
    return [];
  }

  return output
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.endsWith('.md'));
}

/**
 * Читает содержимое файла из git object database без checkout рабочей копии.
 *
 * @param repoPath - Путь к git-репозиторию.
 * @param commitSha - Commit SHA markdown-ревизии.
 * @param filePath - Repo-relative путь файла.
 * @returns Содержимое файла на указанной ревизии.
 */
function readFileFromRevision(repoPath: string, commitSha: string, filePath: string): string {
  return runGitCommand(repoPath, ['show', `${commitSha}:${filePath}`]);
}

/**
 * Читает и парсит markdown-документы из конкретной git-ревизии.
 *
 * @param params - Параметры репозитория, ревизии и frontmatter-маппингов.
 * @returns Нормализованные документы с metadata `sourceBranch`, `sourceCommitSha`, `sourcePath`, `importedAt`.
 * @throws Если commit недоступен, не принадлежит ветке или docs path находится вне репозитория.
 */
export function readRevisionDocuments({
  repoPath,
  docsPath,
  branch,
  commitSha,
  technologyMapping,
  specialtyMapping,
}: TReadRevisionDocumentsParams): DocItem[] {
  assertRevision(repoPath, branch, commitSha);
  const docsRelativePath = toRepoRelativePath(repoPath, docsPath);
  const markdownFiles = listMarkdownFiles(repoPath, commitSha, docsRelativePath);
  const importedAt = new Date();
  const documents: DocItem[] = [];

  for (const filePath of markdownFiles) {
    const fileContent = readFileFromRevision(repoPath, commitSha, filePath);
    const parsedDocument = processMarkdownContent({
      filePath,
      content: fileContent,
      technologyMapping,
      specialtyMapping,
      revisionMetadata: {
        sourceBranch: branch,
        sourceCommitSha: commitSha,
        sourcePath: filePath,
        importedAt,
      },
    });

    if (parsedDocument) {
      documents.push(parsedDocument);
    }
  }

  return documents;
}
