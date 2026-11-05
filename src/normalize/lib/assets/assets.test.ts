import { buildAssetIndex, isImagePath, toAssetUrl } from './assets';
import { DESCRIBE_CASES } from '../../../helpers/test';

describe('Unit/normalize/function/assets', () => {
  describe(DESCRIBE_CASES.SUCCESS, () => {
    it('Строит адрес по правилам Quartz', () => {
      expect(toAssetUrl('img/Pasted image 20230529002900.png', 'https://kb.test')).toBe(
        'https://kb.test/img/Pasted-image-20230529002900.png',
      );
    });

    it('Кодирует кириллицу, % и ? как Quartz', () => {
      expect(toAssetUrl('Схемы/100% готово?.png', 'https://kb.test')).toBe(
        `https://kb.test/${encodeURIComponent('Схемы')}/${encodeURIComponent('100-percent-готово-q.png')}`,
      );
    });

    it('Индексирует картинку по имени и по пути без учёта регистра', () => {
      const index = buildAssetIndex(['img/Logo.PNG', 'notes/a.md']);

      expect(index.get('logo.png')).toBe('img/Logo.PNG');
      expect(index.get('img/logo.png')).toBe('img/Logo.PNG');
      expect(index.size).toBe(2);
    });
  });

  describe(DESCRIBE_CASES.EDGE, () => {
    it('При одинаковых именах оставляет первый путь по алфавиту', () => {
      const index = buildAssetIndex(['b/x.png', 'a/x.png']);

      expect(index.get('x.png')).toBe('a/x.png');
    });
  });

  describe(DESCRIBE_CASES.ERROR, () => {
    it('Не считает картинкой заметку и файл без расширения', () => {
      expect(isImagePath('note.md')).toBe(false);
      expect(isImagePath('Семин Алексей — собеседование')).toBe(false);
    });
  });
});
