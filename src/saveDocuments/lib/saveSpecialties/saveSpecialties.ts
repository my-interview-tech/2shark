import { TSaveSpecialties } from './types';
import { SCHEMA } from '../../../schema';

/**
 * Сохраняет специальности в базу данных (upsert) и возвращает карту их идентификаторов.
 *
 * Правила:
 * - Для каждой специальности выполняется UPSERT по slug/name с установкой `priority`
 * - Возвращается `Map`: исходное имя специальности → `id` записи в БД
 * - Логи включаются при `debug=true`
 *
 * Транзакционность должна обеспечиваться вызывающей стороной (внешний `BEGIN/COMMIT`).
 *
 * @param client Клиент PostgreSQL (с методом `query`)
 * @param specialties Карта специальностей: имя → { name, slug, priority }
 * @param debug Включить подробные логи (по умолчанию false)
 * @returns Карта соответствий имени специальности её `id` в БД
 *
 * @example
 * const ids = await saveSpecialties(client, new Map([
 *   ['Frontend', { name: 'Frontend', slug: 'frontend', priority: 1 }],
 *   ['Backend', { name: 'Backend', slug: 'backend', priority: 2 }],
 * ]));
 * // ids.get('Frontend') => 1
 */
export async function saveSpecialties(
    { client, specialties, debug = false }: TSaveSpecialties,
): Promise<Map<string, number>> {
    const specialtyIds = new Map<string, number>();

    // Сохраняем специальности
    for (const [key, specialty] of specialties) {
        if (debug) console.log(`Сохраняем специальность: ${specialty.name}`);

        const result = await client.query(SCHEMA.UPSERT_SPECIALTY_QUERY, [
            specialty.name,
            specialty.slug,
            specialty.priority,
        ]);

        specialtyIds.set(key, result.rows[0].id);

        if (debug) console.log(`Специальность ${specialty.name} сохранена с ID: ${result.rows[0].id}`);
    }

    return specialtyIds;
}
