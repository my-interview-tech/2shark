import { createTechnologySpecialtyLinks } from './createTechnologySpecialtyLinks';
import { DESCRIBE_CASES } from '../../../helpers/test';

describe('Unit/helpers/function/createTechnologySpecialtyLinks', () => {
    const client: any = { query: jest.fn() };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe(DESCRIBE_CASES.SUCCESS, () => {
        it('создаёт связи и дополняет технологии при отсутствии', async () => {
            const technologyMapping: any = {
                React: { specialty: 'Frontend', priority: 5, description: '' },
            };
            const specialtyIds = new Map<string, number>([['Frontend', 1]]);
            const technologyIds = new Map<string, number>();
            const technologies = new Map<string, any>();

            // upsert tech + link
            client.query
                .mockResolvedValueOnce({ rows: [{ id: 10 }] }) // UPSERT_TECHNOLOGY_QUERY
                .mockResolvedValueOnce({ rows: [{ id: 1 }] }); // UPSERT_SPECIALTY_TECHNOLOGY_QUERY

            await createTechnologySpecialtyLinks({ client, technologyMapping, specialtyIds, technologyIds, technologies });

            expect(technologyIds.get('React')).toBe(10);
            expect(client.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO technologies'), ['React', 'react', 5]);
            expect(client.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO specialty_technology'), [1, 10, 'React']);
        });
    });

    describe(DESCRIBE_CASES.EDGE, () => {
        it('ничего не делает при пустом маппинге', async () => {
            await createTechnologySpecialtyLinks({ client, technologyMapping: undefined as any, specialtyIds: new Map(), technologyIds: new Map(), technologies: new Map() });
            expect(client.query).not.toHaveBeenCalled();
        });
    });
});

