import { TSaveArticleRelations } from "./types";

/**
 * Сохраняет теги и ссылки для статьи
 *
 * Правила:
 * - Если переданы deleteArticleTags/deleteArticleLinks, старые связи статьи удаляются до записи
 * - Для каждого тега выполняется вставка в `tags` (insertTag), затем связывание в `article_tags` (insertArticleTag)
 * - Для каждой ссылки выполняется вставка в `article_links` (insertArticleLink) с подписью, картинкой и позицией
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
    if (queries.deleteArticleTags) await client.query(queries.deleteArticleTags, [articleId]);
    if (queries.deleteArticleLinks) await client.query(queries.deleteArticleLinks, [articleId]);

    // Сохраняем теги
    for (const tagName of doc.tags) {
        if (debug) console.log(`Сохраняем тег: ${tagName}`);

        const tagResult = await client.query(queries.insertTag, [tagName]);
        const tagId = tagResult.rows[0].id;

        await client.query(queries.insertArticleTag, [articleId, tagId]);
    }

    // Сохраняем ссылки в порядке frontmatter
    const links = doc.links ?? doc.info.map((url) => ({ url, title: null, image: null }));

    for (const [position, link] of links.entries()) {
        if (debug) console.log(`Сохраняем ссылку: ${link.url}`);

        await client.query(queries.insertArticleLink, [articleId, link.url, link.title, link.image, position]);
    }
}
