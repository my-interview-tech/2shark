import { buildUniqueId } from './buildUniqueId';
import { DESCRIBE_CASES } from '../../../helpers/test';

jest.mock('path', () => ({
    basename: jest.fn((p: string, ext?: string) => {
        const name = p.split('/').pop() || '';
        return ext ? name.replace(new RegExp(`\\${ext}$`), '') : name;
    }),
}));

jest.mock('../slugify', () => ({
    slugify: (text: string) => String(text)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, ''),
}));

describe('Unit/lib/function/buildUniqueId', () => {
    describe(DESCRIBE_CASES.SUCCESS, () => {
        it('собирает id из частей пути и имени файла', () => {
            const id = buildUniqueId(['react', 'hooks'], '/cwd/docs/react/hooks.md');
            expect(id).toMatch(/^react-hooks-hooks/);
        });

        it('работает с пустыми частями пути', () => {
            const id = buildUniqueId([], '/cwd/Guide.md');
            expect(id).toMatch(/^guide/);
        });
    });

    describe(DESCRIBE_CASES.EDGE, () => {
        it('корректно нормализует спецсимволы', () => {
            const id = buildUniqueId(['React Docs'], '/cwd/Getting Started.md');
            expect(id).toMatch(/^react-docs-getting-started/);
        });
    });
});


