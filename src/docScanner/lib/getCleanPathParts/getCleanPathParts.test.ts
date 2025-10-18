import path from 'path';
import { getCleanPathParts } from './getCleanPathParts';
import { DESCRIBE_CASES } from '../../../helpers/test';

describe('Unit/lib/function/getCleanPathParts', () => {
    const cwd = process.cwd();

    describe(DESCRIBE_CASES.SUCCESS, () => {
        it('удаляет ведущий префикс docs', () => {
            const abs = path.join(cwd, 'docs', 'react', 'hooks.md');
            expect(getCleanPathParts(abs)).toEqual(['react', 'hooks.md']);
        });

        it('возвращает части как есть, если docs отсутствует', () => {
            const abs = path.join(cwd, 'react', 'hooks.md');
            expect(getCleanPathParts(abs)).toEqual(['react', 'hooks.md']);
        });
    });

    describe(DESCRIBE_CASES.EDGE, () => {
        it('не срезает docs если он не первый сегмент', () => {
            const abs = path.join(cwd, 'src', 'docs', 'a', 'b.md');
            expect(getCleanPathParts(abs)).toEqual(['src', 'docs', 'a', 'b.md']);
        });
    });
});


