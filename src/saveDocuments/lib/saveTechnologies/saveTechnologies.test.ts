import { saveTechnologies } from './saveTechnologies';
import { DESCRIBE_CASES } from '../../../helpers/test';

describe('Unit/helpers/function/saveTechnologies', () => {
    const client: any = { query: jest.fn() };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe(DESCRIBE_CASES.SUCCESS, () => {
        it('сохраняет технологии и возвращает их id', async () => {
            const technologies = new Map<string, any>([
                ['React', { name: 'React', slug: 'react', priority: 5 }],
                ['TypeScript', { name: 'TypeScript', slug: 'typescript', priority: 3 }],
            ]);

            client.query
                .mockResolvedValueOnce({ rows: [{ id: 10 }] })
                .mockResolvedValueOnce({ rows: [{ id: 20 }] });

            const ids = await saveTechnologies({ client, technologies });

            expect(ids.get('React')).toBe(10);
            expect(ids.get('TypeScript')).toBe(20);
            expect(client.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO technologies'), ['React', 'react', 5]);
            expect(client.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO technologies'), ['TypeScript', 'typescript', 3]);
        });
    });

    describe(DESCRIBE_CASES.EDGE, () => {
        it('возвращает пустую Map для пустого входа', async () => {
            const ids = await saveTechnologies({ client, technologies: new Map() });
            expect(ids.size).toBe(0);
            expect(client.query).not.toHaveBeenCalled();
        });
    });
});

