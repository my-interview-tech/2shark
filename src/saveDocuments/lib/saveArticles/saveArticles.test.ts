import { saveArticles } from './saveArticles';
import { DESCRIBE_CASES } from '../../../helpers/test';

describe('Unit/helpers/function/saveArticles', () => {
    const client: any = { query: jest.fn() };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe(DESCRIBE_CASES.SUCCESS, () => {
        it('сохраняет статьи и связи для указанной технологии и specialty', async () => {
            const documents: any[] = [
                {
                    id: 'react-hooks',
                    title: 'React Hooks',
                    content: '# ...',
                    specialty: 'Frontend',
                    technology: 'React',
                    priority: 5,
                    description: '...',
                    tags: ['react', 'hooks'],
                    info: ['https://react.dev/hooks'],
                    file_hash: 'h',
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            ];

            const specialtyIds = new Map<string, number>([['Frontend', 1]]);
            const technologyIds = new Map<string, number>([['React', 10]]);

            client.query
                .mockResolvedValueOnce({ rows: [{ id: 100 }] }) // INSERT_ARTICLE_QUERY
                .mockResolvedValueOnce({ rows: [{ id: 200 }] }) // INSERT_TAG_QUERY
                .mockResolvedValueOnce({ rows: [{ id: 1 }] })   // INSERT_ARTICLE_TAG_QUERY (returning)
                .mockResolvedValueOnce({ rows: [{ id: 1 }] });  // INSERT_ARTICLE_LINK_QUERY (returning)

            await saveArticles({ client, documents, specialtyIds, technologyIds });

            expect(client.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO articles'), expect.any(Array));
            expect(client.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO tags'), expect.any(Array));
            expect(client.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO article_tags'), expect.any(Array));
            expect(client.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO article_links'), expect.any(Array));
        });
    });

    describe(DESCRIBE_CASES.EDGE, () => {
        it('пропускает статью без technologyId', async () => {
            const documents: any[] = [
                { id: 'a', title: 't', content: '', specialty: 'Frontend', technology: 'Unknown', priority: 1, description: '', tags: [], info: [], file_hash: 'h', created_at: new Date(), updated_at: new Date() },
            ];
            const specialtyIds = new Map<string, number>();
            const technologyIds = new Map<string, number>();
            const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

            await saveArticles({ client, documents, specialtyIds, technologyIds });

            expect(warnSpy).toHaveBeenCalled();
            warnSpy.mockRestore();
        });

        it('пропускает связку без specialtyId', async () => {
            const documents: any[] = [
                { id: 'a', title: 't', content: '', specialty: 'Frontend', technology: 'React', priority: 1, description: '', tags: [], info: [], file_hash: 'h', created_at: new Date(), updated_at: new Date() },
            ];
            const specialtyIds = new Map<string, number>();
            const technologyIds = new Map<string, number>([['React', 10]]);
            const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

            await saveArticles({ client, documents, specialtyIds, technologyIds });

            expect(warnSpy).toHaveBeenCalled();
            warnSpy.mockRestore();
        });
    });
});

