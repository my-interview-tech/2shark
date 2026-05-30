import { extractTechnology } from './extractTechnology';
import { DESCRIBE_CASES } from '../../../helpers/test';

describe('Unit/lib/function/extractTechnology', () => {
    describe(DESCRIBE_CASES.SUCCESS, () => {
        it('возвращает первый сегмент как технологию', () => {
            expect(extractTechnology(['react', 'hooks.md'])).toBe('react');
        });

        it('обрезает числовой префикс с пробелом', () => {
            expect(extractTechnology(['001 Frontend', 'guide.md'])).toBe('Frontend');
            expect(extractTechnology(['10 Backend', 'api.md'])).toBe('Backend');
        });
    });

    describe(DESCRIBE_CASES.EDGE, () => {
        it('возвращает "docs" если массив пустой', () => {
            expect(extractTechnology([])).toBe('docs');
        });

        it('не изменяет сегмент без пробела между числом и текстом', () => {
            expect(extractTechnology(['001-Frontend'])).toBe('001-Frontend');
        });
    });
});


