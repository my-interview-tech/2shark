/**
 * Преобразует текст в URL-friendly slug
 *
 * @param text - Исходный текст для преобразования
 * @param fallback - Значение по умолчанию если результат пустой
 * @param options - Дополнительные опции
 * @param options.addHash - Добавить хеш для уникальности
 * @param options.hashLength - Длина хеша (по умолчанию 8)
 * @returns URL-friendly строка
 *
 * @example
 * ```typescript
 * slugify('React Hooks Guide'); // 'react-hooks-guide'
 * slugify('', 'useId'); // 'useId-abc123def'
 * slugify('React Hooks Guide', 'default', { addHash: true }); // 'react-hooks-guide-abc123def'
 * ```
 */
export const slugify = (
  text: string,
  fallback: string = 'default',
  options: { addHash?: boolean; hashLength?: number } = {},
): string => {
  const { addHash = false, hashLength = 8 } = options;

  if (!text || typeof text !== 'string') {
    // Если fallback = 'useId', генерируем уникальный ID
    if (fallback === 'useId') {
      return `useId-${generateUniqueHash(hashLength)}`;
    }
    return fallback;
  }

  const result = text
    .toLowerCase()
    .replace(/\./g, '-') // Заменяем точки на дефисы
    .replace(/_/g, '-') // Заменяем подчеркивания на дефисы
    .replace(/[^a-z0-9-]/g, '-') // Заменяем все не-буквенно-цифровые символы на дефисы
    .replace(/-+/g, '-') // Убираем множественные дефисы
    .replace(/^-+|-+$/g, '') // Убираем дефисы в начале и конце
    .substring(0, 100); // Ограничиваем длину

  // Если результат пустой и fallback = 'useId', генерируем уникальный ID
  if (!result && fallback === 'useId') {
    return `useId-${generateUniqueHash(hashLength)}`;
  }

  // Если результат пустой, возвращаем fallback
  if (!result) {
    return fallback;
  }

  // Добавляем хеш для уникальности если требуется
  if (addHash) {
    return `${result}-${generateUniqueHash(hashLength)}`;
  }

  return result;
};

/**
 * Генерирует уникальный хеш
 * @param length - Длина хеша
 * @returns Уникальный хеш
 */
function generateUniqueHash(length: number = 8): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2);
  const combined = timestamp + random;

  // Используем более надежный алгоритм для уникальности
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Преобразуем в 32-битное целое
  }

  // Дополняем до нужной длины если нужно
  let result = Math.abs(hash).toString(36);
  while (result.length < length) {
    result += Math.random().toString(36).substring(2);
  }

  return result.substring(0, length);
}
