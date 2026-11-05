import { toAnchor } from './toAnchor';
import { DESCRIBE_CASES } from '../test';

describe('Unit/helpers/toAnchor', () => {
  describe(DESCRIBE_CASES.SUCCESS, () => {
    it('Транслитерирует кириллицу и убирает знаки препинания', () => {
      expect(toAnchor('Что такое DOCTYPE?')).toBe('chto-takoe-doctype');
    });

    it('Сохраняет латиницу и цифры', () => {
      expect(toAnchor('HTML5 и CSS3')).toBe('html5-i-css3');
    });

    it('Сводит ё к e и выбрасывает мягкий знак', () => {
      expect(toAnchor('Всё про Связь')).toBe('vse-pro-svyaz');
    });
  });

  describe(DESCRIBE_CASES.EDGE, () => {
    it('Возвращает fallback, если допустимых символов нет', () => {
      expect(toAnchor('!!!', 'materials')).toBe('materials');
    });

    it('Обрезает длинный заголовок без хвостового дефиса', () => {
      const anchor = toAnchor(`${'a'.repeat(79)} b`);

      expect(anchor).toBe('a'.repeat(79));
    });
  });
});
