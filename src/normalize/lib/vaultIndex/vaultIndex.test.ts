import { buildVaultIndex, resolveNote, toVaultPath } from './vaultIndex';
import { DESCRIBE_CASES } from '../../../helpers/test';
import { DocItem, TechnologyMapping } from '../../../types';

const createDoc = (uid: string, sourcePath: string, technology: string, title = uid): DocItem => ({
  id: uid,
  uid,
  title,
  content: '',
  specialty: 'Frontend',
  technology,
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

const technologyMapping: TechnologyMapping = {
  JSCore: { specialty: 'Frontend', priority: 1, description: '', slug: 'javascript' },
  ReactCore: { specialty: 'Frontend', priority: 2, description: '', slug: 'react' },
};

const vault = buildVaultIndex({
  documents: [
    createDoc('js-closure', 'docs/003 JSCore/Замыкание.md', 'JSCore', 'Что такое замыкание'),
    createDoc('react-closure', 'docs/004 ReactCore/Замыкание.md', 'ReactCore'),
  ],
  technologyMapping,
  docsRoot: './docs',
});

describe('Unit/normalize/function/vaultIndex', () => {
  describe(DESCRIBE_CASES.SUCCESS, () => {
    it('Строит адрес по слагу технологии и типу материала', () => {
      expect(vault.entries[0]).toMatchObject({ path: '003 jscore/замыкание', href: '/topics/javascript/articles/js-closure' });
    });

    it('При совпадении имён выбирает материал своей технологии', () => {
      expect(resolveNote('Замыкание', { vault, techSlug: 'react' })?.uid).toBe('react-closure');
    });

    it('Разрешает цель с путём по концу пути', () => {
      expect(resolveNote('004 ReactCore/Замыкание.md', { vault, techSlug: 'javascript' })?.uid).toBe('react-closure');
    });

    it('Находит материал по заголовку, если имени файла нет', () => {
      expect(resolveNote('Что такое замыкание', { vault, techSlug: 'react' })?.uid).toBe('js-closure');
    });
  });

  describe(DESCRIBE_CASES.EDGE, () => {
    it('Без своей технологии берёт первое совпадение по пути', () => {
      expect(resolveNote('замыкание', { vault, techSlug: 'html' })?.uid).toBe('js-closure');
    });

    it('Считает путь от корня vault', () => {
      expect(toVaultPath('docs/a/b.md', './docs/')).toBe('a/b.md');
      expect(toVaultPath('other/a.md', 'docs')).toBe('other/a.md');
    });
  });

  describe(DESCRIBE_CASES.ERROR, () => {
    it('Не индексирует материалы технологии без публичного слага', () => {
      const index = buildVaultIndex({
        documents: [createDoc('nav', 'docs/0000 Навигация/100 Git.md', 'Навигация')],
        technologyMapping: { Навигация: { specialty: 'Frontend', priority: 0, description: '' } },
        docsRoot: 'docs',
      });

      expect(index.entries).toEqual([]);
    });

    it('Возвращает null для пустой и неизвестной цели', () => {
      expect(resolveNote('', { vault, techSlug: 'react' })).toBeNull();
      expect(resolveNote('Нет такой', { vault, techSlug: 'react' })).toBeNull();
    });
  });
});
