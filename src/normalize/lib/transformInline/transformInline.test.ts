import { mapOutsideCodeSpans, transformInline } from './transformInline';
import { DESCRIBE_CASES } from '../../../helpers/test';
import { buildAssetIndex } from '../assets';
import { TInlineContext, TVaultIndex } from '../../types';

const vault: TVaultIndex = { byName: new Map(), byTitle: new Map(), entries: [] };
const entry = { uid: 'u1', title: 'DOM [дерево]', path: 'a/dom', techSlug: 'browser', kind: 'article' as const, href: '/topics/browser/articles/u1' };

vault.entries.push(entry);
vault.byName.set('dom', [entry]);

const createContext = (): TInlineContext => ({
  vault,
  assets: buildAssetIndex(['img/a.png']),
  assetsBaseUrl: 'https://kb.test',
  techSlug: 'browser',
  warn: jest.fn(),
});

describe('Unit/normalize/function/transformInline', () => {
  describe(DESCRIBE_CASES.SUCCESS, () => {
    it('Добавляет якорь заголовка из #heading', () => {
      expect(transformInline('[[DOM#Узлы и элементы|узлы]]', createContext())).toBe(
        '[узлы](/topics/browser/articles/u1#uzly-i-elementy)',
      );
    });

    it('Ссылка только на заголовок ведёт на якорь текущей страницы', () => {
      expect(transformInline('[[#Итоги]]', createContext())).toBe('[Итоги](#itogi)');
    });

    it('Подпись embed картинки становится alt, размер — нет', () => {
      const context = createContext();

      expect(transformInline('![[a.png|Схема]] ![[a.png|300x200]]', context)).toBe(
        '![Схема](https://kb.test/img/a.png) ![](https://kb.test/img/a.png)',
      );
    });
  });

  describe(DESCRIBE_CASES.EDGE, () => {
    it('Разбирает экранированный разделитель в таблице и экранирует скобки подписи', () => {
      expect(transformInline('| [[DOM\\|DOM]] |', createContext())).toBe('| [DOM](/topics/browser/articles/u1) |');
      expect(transformInline('![[DOM]]', createContext())).toBe(
        'См. также: [DOM \\[дерево\\]](/topics/browser/articles/u1)',
      );
    });

    it('Без подписи берёт имя файла из пути', () => {
      const context = createContext();

      expect(transformInline('[[папка/Нет такой]]', context)).toBe('Нет такой');
      expect(context.warn).toHaveBeenCalledWith('unresolved-link', 'папка/Нет такой');
    });
  });

  describe(DESCRIBE_CASES.ERROR, () => {
    it('Неизвестная заметка в embed удаляется с предупреждением', () => {
      const context = createContext();

      expect(transformInline('![[Семин Алексей — собеседование]]', context)).toBe('');
      expect(context.warn).toHaveBeenCalledWith('unresolved-embed', 'Семин Алексей — собеседование');
    });
  });
});

describe('Unit/normalize/function/mapOutsideCodeSpans', () => {
  describe(DESCRIBE_CASES.SUCCESS, () => {
    it('Не передаёт в преобразование inline-код', () => {
      expect(mapOutsideCodeSpans('a `b` c ``d`` e', (part) => part.toUpperCase())).toBe('A `b` C ``d`` E');
    });
  });
});
