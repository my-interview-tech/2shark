import { saveSpecialties } from './saveSpecialties';
import { DESCRIBE_CASES } from '../../../helpers/test';

describe('Unit/helpers/function/saveSpecialties', () => {
    const client: any = { query: jest.fn() };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe(DESCRIBE_CASES.SUCCESS, () => {
        it('сохраняет специальности и возвращает их id', async () => {
            const specialties = new Map<string, any>([
                ['Frontend', { name: 'Frontend', slug: 'frontend', priority: 1 }],
                ['Backend', { name: 'Backend', slug: 'backend', priority: 2 }],
            ]);

            client.query
                .mockResolvedValueOnce({ rows: [{ id: 1 }] })
                .mockResolvedValueOnce({ rows: [{ id: 2 }] });

            const ids = await saveSpecialties({ client, specialties });

            expect(ids.get('Frontend')).toBe(1);
            expect(ids.get('Backend')).toBe(2);
            expect(client.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO specialties'), ['Frontend', 'frontend', 1]);
            expect(client.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO specialties'), ['Backend', 'backend', 2]);
        });
    });

    describe(DESCRIBE_CASES.EDGE, () => {
        it('возвращает пустую Map для пустого входа', async () => {
            const ids = await saveSpecialties({ client, specialties: new Map() });
            expect(ids.size).toBe(0);
            expect(client.query).not.toHaveBeenCalled();
        });
    });
});

