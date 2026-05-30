import { DESCRIBE_CASES } from '../../../helpers';
import { calculateFileHash } from './fileHash';

describe('Unit/lib/function/calculateFileHash', () => {
  describe(DESCRIBE_CASES.SUCCESS, () => {
    it('должен возвращать корректный SHA-256 хеш для строки', () => {
      const input = 'test content';
      const hash = calculateFileHash(input);

      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('должен возвращать одинаковый хеш для одинакового ввода', () => {
      const input = 'repeatable';
      const hash1 = calculateFileHash(input);
      const hash2 = calculateFileHash(input);

      expect(hash1).toBe(hash2);
    });

    it('должен возвращать разный хеш для разного ввода', () => {
      const hash1 = calculateFileHash('abc');
      const hash2 = calculateFileHash('def');

      expect(hash1).not.toBe(hash2);
    });
  });

  describe(DESCRIBE_CASES.EDGE, () => {
    it('должен возвращать корректный хеш для пустой строки', () => {
      const hash = calculateFileHash('');

      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('должен возвращать корректный хеш для очень длинной строки', () => {
      const longStr = 'a'.repeat(1000000);
      const hash = calculateFileHash(longStr);

      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe(DESCRIBE_CASES.ERROR, () => {
    it('должен выбрасывать ошибку при невалидном типе (undefined)', () => {
      // @ts-expect-error
      expect(() => calculateFileHash(undefined)).toThrow();
    });
    it('должен выбрасывать ошибку при невалидном типе (null)', () => {
      // @ts-expect-error
      expect(() => calculateFileHash(null)).toThrow();
    });
  });
});
