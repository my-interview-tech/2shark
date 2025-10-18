import { TSaveTechnologies } from './types';
import { SCHEMA } from '../../../schema';

/**
 * Сохраняет технологии в базу данных (upsert) и возвращает карту их идентификаторов.
 *
 * Правила:
 * - Для каждой технологии выполняется UPSERT по slug/name с установкой `priority`
 * - Возвращается `Map`: исходное имя технологии → `id` записи в БД
 * - Логи включаются при `debug=true`
 *
 * Транзакционность должна обеспечиваться вызывающей стороной (внешний `BEGIN/COMMIT`).
 *
 * @param client Клиент PostgreSQL (с методом `query`)
 * @param technologies Карта технологий: имя → { name, slug, priority }
 * @param debug Включить подробные логи (по умолчанию false)
 * @returns Карта соответствий имени технологии её `id` в БД
 *
 * @example
 * const ids = await saveTechnologies({
 *   client,
 *   technologies: new Map([
 *   ['React', { name: 'React', slug: 'react', priority: 5 }],
 *   ['TypeScript', { name: 'TypeScript', slug: 'typescript', priority: 3 }],
 * ]));
 * // ids.get('React') => 10
 */
export async function saveTechnologies({
  client,
  technologies,
  debug = false,
}: TSaveTechnologies): Promise<Map<string, number>> {
  const technologyIds = new Map<string, number>();

  // Сохраняем технологии
  for (const [key, technology] of technologies) {
    if (debug) console.log(`Сохраняем технологию: ${technology.name}`);

    const result = await client.query(SCHEMA.UPSERT_TECHNOLOGY_QUERY, [
      technology.name,
      technology.slug,
      technology.priority,
    ]);

    technologyIds.set(key, result.rows[0].id);
    if (debug) console.log(`Технология ${technology.name} сохранена с ID: ${result.rows[0].id}`);
  }

  return technologyIds;
}
