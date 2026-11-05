import { saveArticleRelations } from './saveArticleRelations';
import { DESCRIBE_CASES } from '../../../helpers/test';

describe('Unit/saveDocuments/function/saveArticleRelations', () => {
    const client: any = { query: jest.fn() };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    const baseDoc: any = {
        id: 'id',
        title: 't',
        content: '',
        specialty: 's',
        technology: 'tech',
        priority: 1,
        description: '',
        tags: [],
        info: [],
        file_hash: 'h',
        created_at: new Date(),
        updated_at: new Date(),
    };

    describe(DESCRIBE_CASES.SUCCESS, () => {
        it('вставляет теги и ссылки', async () => {
            const doc = { ...baseDoc, tags: ['a', 'b'], info: ['https://x'] };

            client.query
                .mockResolvedValueOnce({ rows: [{ id: 101 }] }) // insertTag a
                .mockResolvedValueOnce({ rows: [{ id: 1 }] })   // insertArticleTag
                .mockResolvedValueOnce({ rows: [{ id: 102 }] }) // insertTag b
                .mockResolvedValueOnce({ rows: [{ id: 1 }] })   // insertArticleTag
                .mockResolvedValueOnce({ rows: [{ id: 1 }] });  // insertArticleLink

            await saveArticleRelations({
                client,
                articleId: 42,
                doc,
                queries: {
                    insertTag: 'INSERT INTO tags',
                    insertArticleTag: 'INSERT INTO article_tags',
                    insertArticleLink: 'INSERT INTO article_links',
                },
            });

            expect(client.query).toHaveBeenCalledWith('INSERT INTO tags', ['a']);
            expect(client.query).toHaveBeenCalledWith('INSERT INTO article_tags', [42, 101]);
            expect(client.query).toHaveBeenCalledWith('INSERT INTO tags', ['b']);
            expect(client.query).toHaveBeenCalledWith('INSERT INTO article_tags', [42, 102]);
            expect(client.query).toHaveBeenCalledWith('INSERT INTO article_links', [42, 'https://x', null, null, 0]);
        });

        it('пересобирает связи и пишет ссылки с подписью и позицией', async () => {
            const doc = {
                ...baseDoc,
                info: ['https://a', 'https://b'],
                links: [
                    { url: 'https://a', title: 'A', image: 'https://a/img.png' },
                    { url: 'https://b', title: null, image: null },
                ],
            };

            client.query.mockResolvedValue({ rows: [] });

            await saveArticleRelations({
                client,
                articleId: 7,
                doc,
                queries: {
                    deleteArticleTags: 'DELETE FROM article_tags',
                    deleteArticleLinks: 'DELETE FROM article_links',
                    insertTag: 'INSERT INTO tags',
                    insertArticleTag: 'INSERT INTO article_tags',
                    insertArticleLink: 'INSERT INTO article_links',
                },
            });

            expect(client.query.mock.calls).toEqual([
                ['DELETE FROM article_tags', [7]],
                ['DELETE FROM article_links', [7]],
                ['INSERT INTO article_links', [7, 'https://a', 'A', 'https://a/img.png', 0]],
                ['INSERT INTO article_links', [7, 'https://b', null, null, 1]],
            ]);
        });
    });

    describe(DESCRIBE_CASES.EDGE, () => {
        it('ничего не делает при пустых массивах', async () => {
            const doc = { ...baseDoc, tags: [], info: [] };

            await saveArticleRelations({
                client,
                articleId: 1,
                doc,
                queries: {
                    insertTag: 'INSERT INTO tags',
                    insertArticleTag: 'INSERT INTO article_tags',
                    insertArticleLink: 'INSERT INTO article_links',
                },
            });

            expect(client.query).not.toHaveBeenCalled();
        });
    });
});

