import { slugify } from './slugify';

describe('Unit/utility/function/slugify', () => {
  describe('SUCCESS_CASES', () => {
    it.each([
      ['Hello World', 'hello-world'],
      ['React Hooks & TypeScript!', 'react-hooks-typescript'],
      ['React 18 Features', 'react-18-features'],
      ['React   Hooks   Guide', 'react-hooks-guide'],
      ['React-Hooks-Guide', 'react-hooks-guide'],
      ['React_Hooks_Guide', 'react-hooks-guide'],
    ])('должен преобразовать "%s" в "%s"', (input, expected) => {
      expect(slugify(input)).toBe(expected);
    });
  });

  describe('EDGE_CASES', () => {
    it.each([
      ['React Хуки', 'react'],
      ['React 🚀 Hooks', 'react-hooks'],
      ['-React-Hooks-', 'react-hooks'],
      ['React--Hooks--Guide', 'react-hooks-guide'],
    ])('должен обработать "%s" как "%s"', (input, expected) => {
      expect(slugify(input)).toBe(expected);
    });

    it('должен обработать строку с кастомным fallback', () => {
      expect(slugify('', 'custom-fallback')).toBe('custom-fallback');
    });
  });

  describe('ERROR_CASES', () => {
    it.each([
      ['', 'default'],
      ['!@#$%^&*()', 'default'],
    ])('должен вернуть fallback для "%s"', (input, expected) => {
      expect(slugify(input)).toBe(expected);
    });
  });
});
