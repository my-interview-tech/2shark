import path from 'path';
import { IMAGE_EXTENSIONS } from '../../constants';
import { TAssetIndex } from '../../types';

/**
 * Проверяет, что цель embed — картинка.
 *
 * @param target - Имя или путь файла
 * @returns true для расширений из `IMAGE_EXTENSIONS`
 */
export const isImagePath = (target: string): boolean => {
  const extension = path.posix.extname(target).slice(1).toLowerCase();

  return (IMAGE_EXTENSIONS as readonly string[]).includes(extension);
};

/**
 * Строит индекс картинок vault: по имени файла и по полному пути.
 *
 * @param assetPaths - Пути файлов от корня vault
 * @returns Индекс картинок
 */
export const buildAssetIndex = (assetPaths: string[]): TAssetIndex => {
  const index: TAssetIndex = new Map();

  for (const assetPath of [...assetPaths].sort()) {
    if (!isImagePath(assetPath)) continue;

    const fullKey = assetPath.toLowerCase();
    const nameKey = path.posix.basename(fullKey);

    if (!index.has(fullKey)) index.set(fullKey, assetPath);
    if (!index.has(nameKey)) index.set(nameKey, assetPath);
  }

  return index;
};

/**
 * Возвращает публичный адрес картинки по правилам `slugifyFilePath` из Quartz:
 * пробел → `-`, `%` → `-percent`, `?` → `-q`.
 *
 * @param assetPath - Путь файла от корня vault
 * @param baseUrl - Адрес сайта, который раздаёт картинки
 * @returns Абсолютный адрес картинки
 *
 * @example
 * ```typescript
 * toAssetUrl('img/Pasted image 1.png', 'https://my-interview.tech');
 * // 'https://my-interview.tech/img/Pasted-image-1.png'
 * ```
 */
export const toAssetUrl = (assetPath: string, baseUrl: string): string => {
  const segments = assetPath
    .split('/')
    .filter(Boolean)
    .map((segment) =>
      encodeURIComponent(segment.replace(/\s/g, '-').replace(/%/g, '-percent').replace(/\?/g, '-q')),
    );

  return `${baseUrl}/${segments.join('/')}`;
};
