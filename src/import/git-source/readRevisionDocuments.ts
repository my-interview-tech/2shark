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

function runGitCommand(repoPath: string, args: string[]): string {
  return execFileSync('git', args, { cwd: repoPath, encoding: 'utf-8' }).trim();
}

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

function readFileFromRevision(repoPath: string, commitSha: string, filePath: string): string {
  return runGitCommand(repoPath, ['show', `${commitSha}:${filePath}`]);
}

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
