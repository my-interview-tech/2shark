import { mapOutsideFences, normalizeMarkdown } from './normalizeMarkdown';
import { DESCRIBE_CASES } from '../../../helpers/test';
import { buildVaultIndex } from '../vaultIndex';
import { buildAssetIndex } from '../assets';
import { DocItem } from '../../../types';
import { TMarkdownContext } from '../../types';

const createDoc = (overrides: Partial<DocItem>): DocItem => ({
  id: 'uid',
  uid: 'uid',
  title: 'Title',
  content: '',
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
  created_at: new Date('2025-01-01T00:00:00.000Z'),
  updated_at: new Date('2025-01-01T00:00:00.000Z'),
  ...overrides,
});

const vault = buildVaultIndex({
  documents: [
    createDoc({ uid: 'doctype', title: 'Что такое DOCTYPE', sourcePath: 'docs/001 HTML/005 Что такое DOCTYPE.md' }),
    createDoc({
      uid: 'task-1',
      title: 'Задача',
      technology: 'JSCore',
      kind: 'task',
      sourcePath: 'docs/003 JSCore/Task_1.md',
    }),
  ],
  technologyMapping: {
    HTML: { specialty: 'Frontend', priority: 1, description: '', slug: 'html' },
    JSCore: { specialty: 'Frontend', priority: 2, description: '', slug: 'javascript' },
  },
  docsRoot: 'docs',
});

const createContext = (title = 'Что такое HTML') => {
  const warn = jest.fn();
  const context: TMarkdownContext = {
    vault,
    assets: buildAssetIndex(['img/Pasted image 1.png']),
    assetsBaseUrl: 'https://kb.test',
    techSlug: 'html',
    title,
    warn,
  };

  return { context, warn };
};

describe('Unit/normalize/function/normalizeMarkdown', () => {
  describe(DESCRIBE_CASES.SUCCESS, () => {
    it('Добавляет якоря H2 и H3 и строит оглавление из H2', () => {
      const { context } = createContext();
      const result = normalizeMarkdown('## Зачем нужен DOCTYPE?\n\nТекст.\n\n### Версии\n\nЕщё.\n', context);

      expect(result.contentMd).toBe(
        '## Зачем нужен DOCTYPE? {#zachem-nuzhen-doctype}\n\nТекст.\n\n### Версии {#versii}\n\nЕщё.',
      );
      expect(result.toc).toEqual([{ id: 'zachem-nuzhen-doctype', label: 'Зачем нужен DOCTYPE?' }]);
    });

    it('Переводит wikilink и embeds в ссылки и картинки сайта', () => {
      const { context } = createContext();
      const result = normalizeMarkdown(
        'См. [[005 Что такое DOCTYPE|DOCTYPE]] и [[Task_1]].\n\n![[Pasted image 1.png|600]]\n',
        context,
      );

      expect(result.contentMd).toBe(
        'См. [DOCTYPE](/topics/html/articles/doctype) и [Task_1](/topics/javascript/tasks/task-1).\n\n![](https://kb.test/img/Pasted-image-1.png)',
      );
    });

    it('Делит текст по %% paywall %% и вырезает комментарии', () => {
      const { context } = createContext();
      const result = normalizeMarkdown('Открыто. %%заметка%%\n\n%% paywall %%\n\nЗакрыто.\n', context);

      expect(result.previewMd).toBe('Открыто.');
      expect(result.contentMd).toBe('Открыто.\n\nЗакрыто.');
    });

    it('Без маркера превью — первый абзац с заголовком над ним', () => {
      const { context } = createContext();
      const result = normalizeMarkdown('![[Pasted image 1.png]]\n\n## Коротко\n\nПервый.\n\nВторой.\n', context);

      expect(result.previewMd).toBe('## Коротко {#korotko}\n\nПервый.');
    });

    it('Без абзацев превью — первый целый блок', () => {
      const { context } = createContext();
      const result = normalizeMarkdown('## Шаги\n\n- один\n- два\n\n```js\nx\n```\n', context);

      expect(result.previewMd).toBe('## Шаги {#shagi}\n\n- один\n- два');
    });
  });

  describe(DESCRIBE_CASES.EDGE, () => {
    it('Удаляет ведущий H1, совпадающий с title, и понижает остальные H1', () => {
      const { context } = createContext('001 Что такое HTML?');
      const result = normalizeMarkdown('# Что такое HTML\n\nТекст.\n\n# Итоги\n\nВсё.\n', context);

      expect(result.contentMd).toBe('Текст.\n\n## Итоги {#itogi}\n\nВсё.');
    });

    it('Удаляет ссылки «Назад» и хвостовой разделитель', () => {
      const { context } = createContext();
      const result = normalizeMarkdown('Текст.\n\n---\n\n[[100 Git|Назад]]\n', context);

      expect(result.contentMd).toBe('Текст.');
    });

    it('Не трогает wikilink и комментарии внутри кода', () => {
      const { context, warn } = createContext();
      const source = '```md\n[[note]] %%x%%\n```\n\nКод `[[inline]]` тут.\n';
      const result = normalizeMarkdown(source, context);

      expect(result.contentMd).toBe(source.trimEnd());
      expect(warn).not.toHaveBeenCalled();
    });

    it('Делает якоря уникальными и не занимает resources', () => {
      const { context } = createContext();
      const result = normalizeMarkdown('## Resources\n\n## Шаг\n\n## Шаг\n\n## Свой {#custom}\n', context);

      expect(result.toc.map((item) => item.id)).toEqual(['resources-2', 'shag', 'shag-2', 'custom']);
    });

    it('Встраивание заметки становится ссылкой «См. также»', () => {
      const { context } = createContext();
      const result = normalizeMarkdown('![[005 Что такое DOCTYPE]]\n', context);

      expect(result.contentMd).toBe('См. также: [Что такое DOCTYPE](/topics/html/articles/doctype)');
    });
  });

  describe(DESCRIBE_CASES.ERROR, () => {
    it('Неразрешённая ссылка становится текстом и попадает в предупреждения', () => {
      const { context, warn } = createContext();
      const result = normalizeMarkdown('Читай [[Нет такой|тут]] и ![[missing.png]].\n', context);

      expect(result.contentMd).toBe('Читай тут и .');
      expect(warn).toHaveBeenCalledWith('unresolved-link', 'Нет такой');
      expect(warn).toHaveBeenCalledWith('unresolved-embed', 'missing.png');
    });

    it('Сообщает о base64-картинке, но оставляет её', () => {
      const { context, warn } = createContext();
      const result = normalizeMarkdown('![](data:image/png;base64,AAAA)\n', context);

      expect(result.contentMd).toBe('![](data:image/png;base64,AAAA)');
      expect(warn).toHaveBeenCalledWith('base64-image', '');
    });

    it('Пустой текст даёт пустой результат', () => {
      const { context } = createContext();

      expect(normalizeMarkdown('', context)).toEqual({ contentMd: '', previewMd: '', toc: [] });
    });
  });
});

describe('Unit/normalize/function/mapOutsideFences', () => {
  describe(DESCRIBE_CASES.SUCCESS, () => {
    it('Пропускает fenced-блоки любой длины и вида', () => {
      const source = 'a\n````\nb\n```\nc\n````\n~~~\nd\n~~~\ne';
      const result = mapOutsideFences(source, (chunk) => chunk.toUpperCase());

      expect(result).toBe('A\n````\nb\n```\nc\n````\n~~~\nd\n~~~\nE');
    });
  });
});
