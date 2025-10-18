import { collectAndSaveEntities } from './collectAndSaveEntities';
import { DESCRIBE_CASES } from '../../../helpers';

describe('Unit/helpers/function/collectAndSaveEntities', () => {
    const client: any = { query: jest.fn() };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe(DESCRIBE_CASES.SUCCESS, () => {
        it('собирает и сохраняет сущности, создаёт связи', async () => {
            const documents = [
                { technology: 'React', specialty: 'Frontend', id: 'a', title: 't', content: '', priority: 1, description: '', tags: [], info: [], file_hash: 'h', created_at: new Date(), updated_at: new Date() },
                { technology: 'TypeScript', specialty: 'Frontend', id: 'b', title: 't2', content: '', priority: 2, description: '', tags: [], info: [], file_hash: 'h2', created_at: new Date(), updated_at: new Date() },
            ] as any;

            // mock ids returning
            client.query.mockResolvedValueOnce({ rows: [{ id: 11 }] }); // upsert specialty Frontend
            client.query.mockResolvedValueOnce({ rows: [{ id: 21 }] }); // upsert tech React
            client.query.mockResolvedValueOnce({ rows: [{ id: 22 }] }); // upsert tech TypeScript
            client.query.mockResolvedValueOnce({ rows: [] }); // link

            const technologyMapping = {
                React: { specialty: 'Frontend', priority: 5, description: '' },
            } as any;

            const { specialtyIds, technologyIds } = await collectAndSaveEntities({
                client,
                documents,
                technologyMapping,
                specialtyMapping: undefined,
                debug: false,
            });

            expect(specialtyIds.get('Frontend')).toBe(11);
            expect(technologyIds.get('React')).toBe(21);
            expect(technologyIds.get('TypeScript')).toBe(22);
        });
    });
});

