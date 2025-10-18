import { TSaveArticles } from './types';
import { toSlug, toStringArray } from '../utils';
import { saveArticleRelations } from '../saveArticleRelations';
import { SCHEMA } from '../../../schema';

/**
 * Сохраняет статьи и их связи (теги, ссылки) для набора документов.
 *
 * Правила:
 * - Если для документа не найден `technologyId` в `technologyIds` — статья пропускается
 * - Если для специальности не найден `specialtyId` — конкретная связка статья×специальность пропускается
 * - Для каждой статьи и каждой специальности создаётся запись в `articles` с уникальным slug
 * - После вставки статьи создаются теги и ссылки через `saveArticleRelations`
 *
 * Параметр `technologyMapping` позволяет переопределить список специальностей для технологии
 * (строка, строка с запятыми или массив строк). Если маппинга нет — используется `doc.specialty`.
 *
 * Транзакционность должна обеспечиваться вызывающей стороной (внешний `BEGIN/COMMIT`).
 *
 * @param params.client Клиент PostgreSQL (с методом query)
 * @param params.documents Список документов
 * @param params.specialtyIds Карта: имя специальности → id
 * @param params.technologyIds Карта: имя технологии → id
 * @param params.technologyMapping Необязательный маппинг технологий в специальности
 * @param params.debug Включить подробные логи
 *
 * @example
 * await saveArticles({
 *   client,
 *   documents,
 *   specialtyIds: new Map([['Frontend', 1]]),
 *   technologyIds: new Map([['React', 10]]),
 *   technologyMapping: { React: { specialty: 'Frontend', priority: 1, description: '' } },
 *   debug: process.env.DEBUG_SAVE === '1',
 * });
 */
export async function saveArticles(
    { client, documents, specialtyIds, technologyIds, technologyMapping, debug = false }: TSaveArticles,
): Promise<void> {

    // Сохраняем статьи
    for (const doc of documents) {
        const technologyId = technologyIds.get(doc.technology);

        if (!technologyId) {
            console.warn(`Пропускаем статью ${doc.title}: не найдена technology`);
            continue;
        }

        const mapping = technologyMapping?.[doc.technology];
        const specialties = mapping ? toStringArray(mapping.specialty) : [doc.specialty];

        // Сохраняем статью для каждой специальности
        for (const specialty of specialties) {
            const specialtyId = specialtyIds.get(specialty);

            if (!specialtyId) {
                console.warn(`Пропускаем статью ${doc.title} для specialty ${specialty}: не найдена specialty`);
                continue;
            }

            const uniqueSlug = `${doc.id}-${toSlug(specialty)}`;

            if (debug) console.log(`Сохраняем статью: ${doc.title} (${uniqueSlug})`);

            const articleResult = await client.query(SCHEMA.INSERT_ARTICLE_QUERY, [
                doc.title,
                uniqueSlug,
                doc.content,
                specialtyId,
                technologyId,
                doc.priority,
                doc.description,
                doc.file_hash,
            ]);

            const articleId = articleResult.rows[0].id;

            // Сохраняем связанные теги и ссылки
            await saveArticleRelations({
                client,
                articleId,
                doc,
                queries: {
                    insertTag: SCHEMA.INSERT_TAG_QUERY,
                    insertArticleTag: SCHEMA.INSERT_ARTICLE_TAG_QUERY,
                    insertArticleLink: SCHEMA.INSERT_ARTICLE_LINK_QUERY,
                },
                debug,
            });
        }
    }
}