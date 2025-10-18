import { SCHEMA } from '../../../schema';
import { toSlug, toStringArray } from '../utils';
import { createTechnology } from '../createNamedEntity';
import { TCreateTechnologySpecialtyLinks } from './types';

/**
 * Создает связи между технологиями и специальностями на основе маппинга.
 *
 * Правила:
 * - Если технологии нет в карте `technologies`, она создаётся (UPSERT) и
 *   добавляется в `technologyIds`
 * - Для каждой технологии берётся список специальностей из `technologyMapping`
 *   (строка/строка с запятыми/массив) и создаются связи (UPSERT в `specialty_technology`)
 * - Логи включаются флагом `debug`
 * - Транзакция — снаружи (функция предполагает, что она уже начата)
 *
 * @param client Клиент PostgreSQL (query)
 * @param technologyMapping Маппинг технологий в специальности
 * @param specialtyIds Карта: specialty → id
 * @param technologyIds Карта: technology → id (будет дополняться)
 * @param technologies Карта сущностей технологий (имя → { name, slug, priority })
 * @param debug Включить логи
 *
 * @example
 * await createTechnologySpecialtyLinks({
 *   client,
 *   technologyMapping: {
 *     React: { specialty: 'Frontend', priority: 5, description: '' }
 *   },
 *   specialtyIds: new Map([['Frontend', 1]]),
 *   technologyIds: new Map(),
 *   technologies: new Map(),
 *   debug: true
 * });
 */
export async function createTechnologySpecialtyLinks(
    { client, technologyMapping, specialtyIds, technologyIds, technologies, debug = false }: TCreateTechnologySpecialtyLinks,
): Promise<void> {
    if (!technologyMapping) return;

    if (debug) console.log('Создаем связи между технологиями и специальностями...');

    // Создаем связи между технологиями и специальностями
    for (const [techName, techMapping] of Object.entries(technologyMapping)) {
        // Создаем технологию, если её нет в документах
        if (!technologies.has(techName)) {
            technologies.set(
                techName,
                createTechnology(techName, techMapping?.priority || 0)
            );

            const result = await client.query(SCHEMA.UPSERT_TECHNOLOGY_QUERY, [
                techName,
                toSlug(techName),
                techMapping?.priority || 0,
            ]);

            technologyIds.set(techName, result.rows[0].id);

            if (debug) console.log(`Добавлена технология из конфига: ${techName}`);
        }

        const technologyId = technologyIds.get(techName);

        // Если технология не найдена в документах, пропускаем
        if (!technologyId) {
            if (debug) console.log(`Технология ${techName} не найдена в документах`);
            continue;
        }

        const specialtiesList = toStringArray(techMapping?.specialty);

        // Создаем связи между технологиями и специальностями
        for (const specialty of specialtiesList) {
            const specialtyId = specialtyIds.get(specialty);

            // Если специальность не найдена, пропускаем
            if (specialtyId) {
                if (debug) console.log(`Связываем ${techName} с ${specialty}`);

                await client.query(SCHEMA.UPSERT_SPECIALTY_TECHNOLOGY_QUERY, [
                    specialtyId,
                    technologyId,
                    techName
                ]);
            }
        }
    }
}
