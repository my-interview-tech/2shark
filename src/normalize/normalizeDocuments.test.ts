import { normalizeDocuments } from './normalizeDocuments';
import { DESCRIBE_CASES } from '../helpers/test';
import { DocItem } from '../types';

const createDoc = (uid: string, content: string, sourcePath: string): DocItem => ({
  id: uid,
  uid,
  title: uid,
  content,
  specialty: 'Frontend',
  technology: 'HTML',
  priority: 1,
  description: '',
  tags: [],
  info: [],
  access: 'free',
  tools: [],
  order: 1,
  file_hash: 'h',
  created_at: new Date(),
  updated_at: new Date(),
  sourcePath,
});

const params = {
  technologyMapping: { HTML: { specialty: 'Frontend', priority: 1, description: '', slug: 'html' } },
  docsRoot: 'docs',
  assetPaths: [],
  assetsBaseUrl: 'https://kb.test',
};

describe('Unit/normalize/function/normalizeDocuments', () => {
  describe(DESCRIBE_CASES.SUCCESS, () => {
    it('Разрешает ссылки между документами ревизии и не меняет сырой content', () => {
      const documents = [createDoc('a', 'См. [[b]].', 'docs/a.md'), createDoc('b', '## Раздел\n\nТекст.', 'docs/b.md')];
      const result = normalizeDocuments({ ...params, documents });

      expect(result.documents[0]).toMatchObject({ content: 'См. [[b]].', contentMd: 'См. [b](/topics/html/articles/b).' });
      expect(result.documents[1].toc).toEqual([{ id: 'razdel', label: 'Раздел' }]);
      expect(result.warnings).toEqual([]);
    });
  });

  describe(DESCRIBE_CASES.EDGE, () => {
    it('Не дублирует одинаковые предупреждения внутри документа', () => {
      const documents = [createDoc('a', '[[x]] [[x]] [[y]]', 'docs/a.md')];
      const result = normalizeDocuments({ ...params, documents });

      expect(result.warnings).toEqual([
        { uid: 'a', type: 'unresolved-link', target: 'x' },
        { uid: 'a', type: 'unresolved-link', target: 'y' },
      ]);
    });
  });
});
