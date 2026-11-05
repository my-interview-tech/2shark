import { TArticleKind, TImportWarningType, TTocItem } from '../types';

/** Материал vault, на который можно сослаться wikilink. */
export type TVaultEntry = {
  uid: string;
  title: string;
  /** Путь от корня vault без `.md`, в нижнем регистре */
  path: string;
  techSlug: string;
  kind: TArticleKind;
  href: string;
};

export type TVaultIndex = {
  /** Имя файла без `.md` в нижнем регистре → материалы */
  byName: Map<string, TVaultEntry[]>;
  /** Заголовок в нижнем регистре → материалы, запасной путь разрешения */
  byTitle: Map<string, TVaultEntry[]>;
  entries: TVaultEntry[];
};

/** Имя файла картинки в нижнем регистре → путь от корня vault. */
export type TAssetIndex = Map<string, string>;

export type TWarn = (type: TImportWarningType, target: string) => void;

export type TInlineContext = {
  vault: TVaultIndex;
  assets: TAssetIndex;
  assetsBaseUrl: string;
  /** Технология текущего материала: при совпадении имён выигрывает своя */
  techSlug: string;
  warn: TWarn;
};

export type TMarkdownContext = TInlineContext & {
  title: string;
};

export type TNormalizedMarkdown = {
  contentMd: string;
  previewMd: string;
  toc: TTocItem[];
};
