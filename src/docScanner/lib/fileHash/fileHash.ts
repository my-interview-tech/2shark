import crypto from 'crypto';

/**
 * Вычисляет SHA-256 хеш содержимого файла
 *
 * @param content - Содержимое файла
 * @returns SHA-256 хеш в виде строки
 *
 * @example
 * ```typescript
 * const hash = calculateFileHash("# Заголовок\n\nСодержимое файла");
 * console.log(hash); // "a1b2c3d4..."
 * ```
 */
export function calculateFileHash(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}
