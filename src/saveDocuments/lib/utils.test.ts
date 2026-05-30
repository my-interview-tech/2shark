import { DESCRIBE_CASES } from '../../helpers/test';
import { toSlug, toStringArray } from './utils';

describe('Unit/helpers/function/saveDocumentsUtils', () => {
    describe(DESCRIBE_CASES.SUCCESS, () => {
        it('Должна преобразовать строку в slug', () => {
            // Execution
            const result = toSlug('Frontend Developer');

            // Assert
            expect(result).toBe('frontend-developer');
        });

        it('Должна вернуть массив если передан массив строк', () => {
            // Setup
            const value = ['Frontend', 'Backend'];

            // Execution
            const result = toStringArray(value);

            // Assert
            expect(result).toBe(value);
        });

        it('Должна разделить строку со специальностями через запятую', () => {
            // Execution
            const result = toStringArray('Frontend, Backend , Data');

            // Assert
            expect(result).toEqual(['Frontend', 'Backend', 'Data']);
        });

        it('Должна вернуть строку в массиве если нет запятых', () => {
            // Execution
            const result = toStringArray('Mobile');

            // Assert
            expect(result).toEqual(['Mobile']);
        });
    });

    describe(DESCRIBE_CASES.EDGE, () => {
        it('Должна вернуть пустой массив для undefined', () => {
            // Execution
            const result = toStringArray(undefined);

            // Assert
            expect(result).toEqual([]);
        });

        it('Должна вернуть пустой массив для null', () => {
            // Execution
            const result = toStringArray(null);

            // Assert
            expect(result).toEqual([]);
        });
    });
});
