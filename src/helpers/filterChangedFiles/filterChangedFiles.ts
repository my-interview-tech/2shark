import { DocItem } from '../../types';

// todo: переделать на использование из parseDatabase
import { getFileHashes } from '../getFileHashes/getFileHashes';
// import fs from "fs/promises"

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

    console.log(`🔍 Отладка: найдено ${existingHashes.size} хешей в базе данных`);

    if (existingHashes.size > 0) {
      console.log(`🔍 Примеры хешей в БД:`);
      let count = 0;

      for (const [slug, hash] of existingHashes.entries()) {
        if (count < 3) {
          console.log(`   ${slug}: ${hash.substring(0, 10)}...`);
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
        if (slug.startsWith(doc.id + '-')) {
          existingHash = hash;
          break;
        }
      }

      if (!existingHash) {
        changedDocuments.push(doc);

        if (debugCount < 3) {
          console.log(`🔍 Отладка: новый файл ${doc.id} (не найден в БД)`);
          debugCount++;
        }
        continue;
      }

      if (existingHash === doc.file_hash) {
        unchangedCount++;

        continue;
      }

      changedDocuments.push(doc);

      if (debugCount < 3) {
        console.log(`🔍 Отладка: измененный файл ${doc.id}`);
        console.log(`   Хеш в БД: ${existingHash.substring(0, 10)}...`);
        console.log(`   Новый хеш: ${doc.file_hash.substring(0, 10)}...`);
        debugCount++;
      }
    }

    console.log(`📊 Статистика изменений:`);
    console.log(`   - Измененных файлов: ${changedDocuments.length}`);
    console.log(`   - Неизмененных файлов: ${unchangedCount}`);
    console.log(`   - Всего файлов: ${documents.length}`);

    return changedDocuments;
  } catch (error) {
    console.error('Ошибка при фильтрации измененных файлов:', error);

    return documents;
  }
}
