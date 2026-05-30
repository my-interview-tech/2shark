import { DESCRIBE_CASES } from '../../../helpers/test';
import { normalizeSpecialty } from './normalizeSpecialty';

describe('Unit/lib/function/normalizeSpecialty', () => {
    describe(DESCRIBE_CASES.SUCCESS, () => {
        it('берёт первый элемент массива и приводит к строке', () => {
            expect(normalizeSpecialty(['Frontend', 'Backend'])).toBe('Frontend');
            expect(normalizeSpecialty([123, 'Backend'])).toBe('123');
        });

        it('берёт первую часть до запятой из строки', () => {
            expect(normalizeSpecialty('Frontend, Backend')).toBe('Frontend');
            expect(normalizeSpecialty('Data,AI,ML')).toBe('Data');
        });

        it('возвращает исходную строку без запятых', () => {
            expect(normalizeSpecialty('Frontend')).toBe('Frontend');
        });
    });

    describe(DESCRIBE_CASES.EDGE, () => {
        it('возвращает пустую строку для undefined/null', () => {
            expect(normalizeSpecialty(undefined)).toBe('');
            expect(normalizeSpecialty(null as unknown as undefined)).toBe('');
        });

        it('приводит не-строки к строке', () => {
            expect(normalizeSpecialty(42)).toBe('42');
            expect(normalizeSpecialty(true)).toBe('true');
            expect(normalizeSpecialty({})).toBe('[object Object]');
        });
    });
});


