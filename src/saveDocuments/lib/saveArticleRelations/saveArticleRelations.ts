import { TSaveArticleRelations } from "./types";

/**
 * Сохраняет теги и ссылки для статьи
 *
 * Правила:
 * - Для каждого тега выполняется вставка в `tags` (insertTag), затем связывание в `article_tags` (insertArticleTag)
 * - Для каждой ссылки выполняется вставка в `article_links` (insertArticleLink)
 * - Транзакция должна быть открыта снаружи
 * - При debug=true пишет подробные логи
 *
 * @example
 * await saveArticleRelations(client, 42, {
 *   id: 'react-hooks',
 *   title: 'React Hooks',
 *   content: '# ...',
 *   specialty: 'Frontend',
 *   technology: 'React',
 *   priority: 5,
 *   description: '...',
 *   tags: ['react', 'hooks'],
 *   info: ['https://react.dev/hooks'],
 *   file_hash: 'abc123',
 *   created_at: new Date(),
 *   updated_at: new Date(),
 * }, {
 *   insertTag: SCHEMA.INSERT_TAG_QUERY,
 *   insertArticleTag: SCHEMA.INSERT_ARTICLE_TAG_QUERY,
 *   insertArticleLink: SCHEMA.INSERT_ARTICLE_LINK_QUERY,
 * });
 */
export const saveArticleRelations = async (
    { client, articleId, doc, queries, debug = false }: TSaveArticleRelations,
): Promise<void> => {
    // Сохраняем теги
    for (const tagName of doc.tags) {
        if (debug) console.log(`Сохраняем тег: ${tagName}`);

        const tagResult = await client.query(queries.insertTag, [tagName]);
        const tagId = tagResult.rows[0].id;

        await client.query(queries.insertArticleTag, [articleId, tagId]);
    }

    // Сохраняем ссылки
    for (const url of doc.info) {
        if (debug) console.log(`Сохраняем ссылку: ${url}`);

        await client.query(queries.insertArticleLink, [articleId, url]);
    }
}
