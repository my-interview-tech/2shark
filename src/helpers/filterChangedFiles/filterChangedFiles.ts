import { DocItem } from '../../types';
import { getFileHashes } from '../getFileHashes';

function parseStoredHash(storedHash: string): { fileHash: string; sourceCommitSha: string } {
  const [fileHash = '', sourceCommitSha = ''] = storedHash.split(':::');

  return { fileHash, sourceCommitSha };
}

/**
 * Фильтрует документы, оставляя только те, которые изменились
 *
 * @param documents - Массив обработанных документов
 * @returns Promise с массивом документов, которые нужно обновить
 *
 * @example
 * ```typescript
 * const changedDocs = await filterChangedFiles(allDocuments);
 * console.log(`Найдено ${changedDocs.length} измененных файлов`);
 * ```
 */
export async function filterChangedFiles(documents: DocItem[]): Promise<DocItem[]> {
  try {
    const existingHashes = await getFileHashes();

    console.log(`Отладка: найдено ${existingHashes.size} хешей в базе данных`);

    if (existingHashes.size > 0) {
      console.log(`Примеры хешей в БД:`);
      let count = 0;

      for (const [slug, hash] of existingHashes.entries()) {
        if (count < 3) {
          console.log(`${slug}: ${hash?.substring(0, 10) || 'null'}...`);
          count++;
        }
      }
    }

    const changedDocuments: DocItem[] = [];
    let unchangedCount = 0;

    let debugCount = 0;
  
    for (const doc of documents) {
      let existingHash: string | undefined;

      for (const [slug, hash] of existingHashes.entries()) {
        if (slug === doc.uid || slug === doc.id || slug.startsWith(doc.id + '-')) {
          existingHash = hash;
          break;
        }
      }

      if (!existingHash) {
        changedDocuments.push(doc);

        if (debugCount < 3) {
          console.log(`Отладка: новый файл ${doc.id} (не найден в БД)`);
          debugCount++;
        }
        continue;
      }

      const { fileHash, sourceCommitSha } = parseStoredHash(existingHash);
      const isSameCommit = doc.sourceCommitSha ? sourceCommitSha === doc.sourceCommitSha : true;

      if (fileHash === doc.file_hash && isSameCommit) {
        unchangedCount++;

        continue;
      }

      changedDocuments.push(doc);

      if (debugCount < 3) {
        console.log(`Отладка: измененный файл ${doc.id}`);
        console.log(`Хеш в БД: ${fileHash.substring(0, 10)}...`);
        console.log(`Новый хеш: ${doc.file_hash.substring(0, 10)}...`);

        debugCount++;
      }
    }

    console.log(`Статистика изменений:`);
    console.log(`- Измененных файлов: ${changedDocuments.length}`);
    console.log(`- Неизмененных файлов: ${unchangedCount}`);
    console.log(`- Всего файлов: ${documents.length}`);

    return changedDocuments;
  } catch (error) {
    console.error('Ошибка при фильтрации измененных файлов:', error);

    return documents;
  }
}
