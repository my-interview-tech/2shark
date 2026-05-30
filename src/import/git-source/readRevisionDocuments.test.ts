import { execFileSync } from 'child_process';
import { readRevisionDocuments } from './readRevisionDocuments';
import { processMarkdownContent } from '../../docScanner/lib/processMarkdownFile';
import { DESCRIBE_CASES } from '../../helpers/test';
import { DocItem } from '../../types';

jest.mock('child_process', () => ({
  execFileSync: jest.fn(),
}));

jest.mock('../../docScanner/lib/processMarkdownFile', () => ({
  processMarkdownContent: jest.fn(),
}));

const baseDoc: DocItem = {
  id: 'uid-1',
  uid: 'uid-1',
  title: 'Doc',
  content: '# doc',
  specialty: 'Frontend',
  technology: 'React',
  access: 'public',
  tools: ['React'],
  order: 1,
  priority: 1,
  description: 'd',
  tags: [],
  info: [],
  file_hash: 'hash',
  created_at: new Date('2025-01-01T00:00:00.000Z'),
  updated_at: new Date('2025-01-02T00:00:00.000Z'),
};

describe('Unit/import/function/readRevisionDocuments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (execFileSync as jest.MockedFunction<typeof execFileSync>).mockImplementation((_, args) => {
      const gitArgs = args as string[];

      if (gitArgs.includes('rev-parse')) {
        return 'abc123';
      }

      if (gitArgs.includes('merge-base')) {
        return '';
      }

      if (gitArgs.includes('ls-tree')) {
        return 'docs/a.md\ndocs/b.md\n';
      }

      if (gitArgs.includes('docs/a.md')) {
        return '# a';
      }

      if (gitArgs.includes('docs/b.md')) {
        return '# b';
      }

      return '';
    });
    (processMarkdownContent as jest.MockedFunction<typeof processMarkdownContent>)
      .mockReturnValueOnce({ ...baseDoc, sourcePath: 'docs/a.md' })
      .mockReturnValueOnce({ ...baseDoc, uid: 'uid-2', id: 'uid-2', sourcePath: 'docs/b.md' });
  });

  describe(DESCRIBE_CASES.SUCCESS, () => {
    it('Должна читать markdown-файлы из указанной ревизии', () => {
      const result = readRevisionDocuments({
        repoPath: '/tmp/repo',
        docsPath: 'docs',
        branch: 'master',
        commitSha: 'abc123',
        technologyMapping: { React: { specialty: 'Frontend', priority: 1, description: 'React' } },
        specialtyMapping: { Frontend: { priority: 1, description: 'Frontend' } },
      });

      expect(result).toHaveLength(2);
      expect(processMarkdownContent).toHaveBeenCalledTimes(2);
      expect(execFileSync).toHaveBeenCalled();
    });
  });

  describe(DESCRIBE_CASES.ERROR, () => {
    it('Должна вернуть ошибку если commit не найден', () => {
      (execFileSync as jest.MockedFunction<typeof execFileSync>).mockImplementation((_, args) => {
        const gitArgs = args as string[];

        if (gitArgs.includes('rev-parse')) {
          throw new Error('not found');
        }

        return '';
      });

      expect(() =>
        readRevisionDocuments({
          repoPath: '/tmp/repo',
          docsPath: 'docs',
          branch: 'master',
          commitSha: 'unknown',
          technologyMapping: { React: { specialty: 'Frontend', priority: 1, description: 'React' } },
          specialtyMapping: { Frontend: { priority: 1, description: 'Frontend' } },
        }),
      ).toThrow('Commit SHA не найден');
    });
  });
});
