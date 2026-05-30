/**
 * Нормализует значение специальности к строке.
 *
 * Правила:
 * - Если передан массив — берём первый элемент и приводим к строке
 * - Если передана строка с запятыми — берём первую часть до запятой (trim)
 * - Иначе — приводим значение к строке, пустое/undefined → ''
 *
 * Примеры:
 * - ['Frontend','Backend'] → 'Frontend'
 * - 'Frontend, Backend' → 'Frontend'
 * - 'Frontend' → 'Frontend'
 * - undefined → ''
 */
export function normalizeSpecialty(specialtyValue: unknown): string {
    if (Array.isArray(specialtyValue)) return String(specialtyValue[0]);

    if (typeof specialtyValue === 'string' && specialtyValue.includes(',')) {
        return specialtyValue.split(',')[0].trim();
    }

    return String(specialtyValue ?? '');
}