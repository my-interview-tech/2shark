/**
 * Преобразует имя в slug (URL-friendly строку)
 *
 * @example
 * toSlug('Frontend Developer'); // 'frontend-developer'
 * toSlug('Data Science'); // 'data-science'
 */
export const toSlug = (name: string): string => {
    return name.toLowerCase().replace(/\s+/g, '-');
}

/**
 * Нормализует значение специальности в массив строк
 *
 * Возвращает массив даже для одиночных значений. Поддерживает:
 * - массив строк
 * - строку c запятыми
 * - одиночную строку
 * - null/undefined → []
 *
 * @example
 * toStringArray(['Frontend', 'Backend']); // ['Frontend', 'Backend']
 * toStringArray('Frontend, Backend , Data'); // ['Frontend', 'Backend', 'Data']
 * toStringArray('Mobile'); // ['Mobile']
 * toStringArray(undefined); // []
 * toStringArray(null); // []
 */
export const toStringArray = (value: string | string[] | undefined | null): string[] => {
    if (!value) return [];
    if (Array.isArray(value)) return value;

    return typeof value === 'string' && value.includes(',')
        ? value.split(',').map((s) => s.trim())
        : [value];
}
