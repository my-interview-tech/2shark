import { getPublicSlug } from '../helpers/toAnchor';
import { DocItem, TechnologyMapping, TImportWarning } from '../types';
import { buildAssetIndex } from './lib/assets';
import { normalizeMarkdown } from './lib/normalizeMarkdown';
import { buildVaultIndex } from './lib/vaultIndex';
import { TWarn } from './types';

type TNormalizeDocumentsParams = {
  documents: DocItem[];
  technologyMapping: TechnologyMapping;
  /** Путь к vault в репозитории: от него считаются пути wikilink и картинок */
  docsRoot: string;
  /** Пути файлов ревизии от корня vault, из них берутся картинки */
  assetPaths: string[];
  assetsBaseUrl: string;
};

type TNormalizeDocumentsResult = {
  documents: DocItem[];
  warnings: TImportWarning[];
};

/**
 * Нормализует markdown всех документов ревизии.
 *
 * Работает до diff по `file_hash`: wikilink разрешается только по полному vault.
 * Сырой `content` не меняется — на нём работает полнотекстовый поиск бекенда.
 *
 * @param params - Документы ревизии, маппинг технологий и картинки vault
 * @returns Документы с `contentMd`, `previewMd`, `toc` и предупреждения без дублей внутри документа
 */
export const normalizeDocuments = ({
  documents,
  technologyMapping,
  docsRoot,
  assetPaths,
  assetsBaseUrl,
}: TNormalizeDocumentsParams): TNormalizeDocumentsResult => {
  const vault = buildVaultIndex({ documents, technologyMapping, docsRoot });
  const assets = buildAssetIndex(assetPaths);
  const warnings: TImportWarning[] = [];

  const normalized = documents.map((doc) => {
    const seen = new Set<string>();
    const warn: TWarn = (type, target) => {
      const key = `${type}:${target}`;

      if (seen.has(key)) return;

      seen.add(key);
      warnings.push(target ? { uid: doc.uid, type, target } : { uid: doc.uid, type });
    };
    const { contentMd, previewMd, toc } = normalizeMarkdown(doc.content, {
      vault,
      assets,
      assetsBaseUrl,
      techSlug: getPublicSlug(technologyMapping[doc.technology]?.slug) ?? '',
      title: doc.title,
      warn,
    });

    return { ...doc, contentMd, previewMd, toc };
  });

  return { documents: normalized, warnings };
};
