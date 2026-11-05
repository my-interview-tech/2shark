import path from 'path';
import { getPublicSlug } from '../../../helpers/toAnchor';
import { DocItem, TechnologyMapping } from '../../../types';
import { KIND_PATH } from '../../constants';
import { TInlineContext, TVaultEntry, TVaultIndex } from '../../types';

const toKey = (value: string): string => value.trim().replace(/\.md$/i, '').toLowerCase();

const pushTo = (map: Map<string, TVaultEntry[]>, key: string, entry: TVaultEntry): void => {
  if (!key) return;

  const list = map.get(key);

  if (list) {
    list.push(entry);

    return;
  }

  map.set(key, [entry]);
};

/**
 * Возвращает путь файла от корня vault.
 *
 * @param sourcePath - Путь файла в репозитории (`docs/001 Frontend/a.md`)
 * @param docsRoot - Путь к vault в репозитории (`docs`)
 * @returns Путь от корня vault (`001 Frontend/a.md`)
 */
export const toVaultPath = (sourcePath: string, docsRoot: string): string => {
  const root = docsRoot.replace(/^\.\/+/, '').replace(/\/+$/, '');
  const normalized = sourcePath.split(path.sep).join('/');

  if (!root || root === '.') return normalized;

  return normalized.startsWith(`${root}/`) ? normalized.slice(root.length + 1) : normalized;
};

type TBuildVaultIndexParams = {
  documents: DocItem[];
  technologyMapping: TechnologyMapping;
  docsRoot: string;
};

/**
 * Строит индекс материалов ревизии для разрешения wikilink.
 *
 * Материалы технологий без публичного слага в индекс не попадают: страницы у них нет.
 *
 * @param params - Документы ревизии, маппинг технологий и путь к vault
 * @returns Индекс по имени файла и заголовку
 */
export const buildVaultIndex = ({ documents, technologyMapping, docsRoot }: TBuildVaultIndexParams): TVaultIndex => {
  const index: TVaultIndex = { byName: new Map(), byTitle: new Map(), entries: [] };
  const sorted = [...documents].sort((a, b) => (a.sourcePath ?? '').localeCompare(b.sourcePath ?? ''));

  for (const doc of sorted) {
    const techSlug = getPublicSlug(technologyMapping[doc.technology]?.slug);

    if (!techSlug) continue;

    const vaultPath = toKey(toVaultPath(doc.sourcePath ?? `${doc.uid}.md`, docsRoot));
    const kind = doc.kind ?? 'article';
    const entry: TVaultEntry = {
      uid: doc.uid,
      title: doc.title,
      path: vaultPath,
      techSlug,
      kind,
      href: `/topics/${techSlug}/${KIND_PATH[kind]}/${doc.uid}`,
    };

    index.entries.push(entry);
    pushTo(index.byName, path.posix.basename(vaultPath), entry);
    pushTo(index.byTitle, toKey(doc.title), entry);
  }

  return index;
};

/**
 * Находит материал по цели wikilink «по кратчайшему пути», как Quartz.
 *
 * Цель с `/` сравнивается с концом пути, без `/` — с именем файла, затем с заголовком.
 * При нескольких совпадениях выигрывает материал той же технологии.
 *
 * @param target - Цель wikilink без `#heading` и подписи
 * @param context - Индекс vault и технология текущего материала
 * @returns Найденный материал или null
 */
export const resolveNote = (target: string, context: Pick<TInlineContext, 'vault' | 'techSlug'>): TVaultEntry | null => {
  const key = toKey(target);

  if (!key) return null;

  const { vault, techSlug } = context;
  const candidates = key.includes('/')
    ? vault.entries.filter((entry) => entry.path === key || entry.path.endsWith(`/${key}`))
    : (vault.byName.get(key) ?? vault.byTitle.get(key) ?? []);

  return candidates.find((entry) => entry.techSlug === techSlug) ?? candidates[0] ?? null;
};
