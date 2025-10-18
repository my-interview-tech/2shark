import { createNamedEntity, createSpecialty, createTechnology } from './createNamedEntity';
import { DESCRIBE_CASES } from '../../../helpers/test';

describe('Unit/saveDocuments/function/createNamedEntity', () => {
    describe(DESCRIBE_CASES.SUCCESS, () => {
        it('создает сущность с именем и приоритетом', () => {
            const result = createNamedEntity('React', 5);

            expect(result).toEqual({
                name: 'React',
                slug: 'react',
                priority: 5,
            });
        });

        it('создает сущность с дефолтным приоритетом', () => {
            const result = createNamedEntity('TypeScript');

            expect(result).toEqual({
                name: 'TypeScript',
                slug: 'typescript',
                priority: 0,
            });
        });

        it('нормализует slug из сложного названия', () => {
            const result = createNamedEntity('React Hooks & TypeScript!', 10);

            expect(result).toEqual({
                name: 'React Hooks & TypeScript!',
                slug: 'react-hooks-&-typescript!',
                priority: 10,
            });
        });
    });

    describe('Обратная совместимость', () => {
        it('createSpecialty работает как createNamedEntity', () => {
            const specialty = createSpecialty('Frontend', 1);

            expect(specialty).toEqual({
                name: 'Frontend',
                slug: 'frontend',
                priority: 1,
            });
        });

        it('createTechnology работает как createNamedEntity', () => {
            const technology = createTechnology('Node.js', 8);

            expect(technology).toEqual({
                name: 'Node.js',
                slug: 'node.js',
                priority: 8,
            });
        });

        it('все функции создают одинаковые объекты для одинаковых параметров', () => {
            const entity1 = createNamedEntity('Vue.js', 3);
            const entity2 = createSpecialty('Vue.js', 3);
            const entity3 = createTechnology('Vue.js', 3);

            expect(entity1).toEqual(entity2);
            expect(entity2).toEqual(entity3);
        });
    });

    describe(DESCRIBE_CASES.EDGE, () => {
        it('обрабатывает пустую строку', () => {
            const result = createNamedEntity('', 1);

            expect(result).toEqual({
                name: '',
                slug: '',
                priority: 1,
            });
        });

        it('обрабатывает специальные символы в названии', () => {
            const result = createNamedEntity('C++ Programming', 2);

            expect(result).toEqual({
                name: 'C++ Programming',
                slug: 'c++-programming',
                priority: 2,
            });
        });

        it('обрабатывает отрицательный приоритет', () => {
            const result = createNamedEntity('Legacy Code', -5);

            expect(result).toEqual({
                name: 'Legacy Code',
                slug: 'legacy-code',
                priority: -5,
            });
        });
    });
});
