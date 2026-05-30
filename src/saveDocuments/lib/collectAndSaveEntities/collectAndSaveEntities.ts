import { TCollectAndSaveEntities, TCollectAndSaveEntitiesResult } from './types';
import { createSpecialty, createTechnology } from '../createNamedEntity';
import { toStringArray } from '../utils';
import { NamedEntity } from '../../types';
import { saveSpecialties } from '../saveSpecialties';
import { saveTechnologies } from '../saveTechnologies';
import { createTechnologySpecialtyLinks } from '../createTechnologySpecialtyLinks';


/** 
 * Собирает и сохраняет специальности и технологии.
 * 
 * Шаги:
 * 1) Собирает список специальностей из `specialtyMapping` и из `technologyMapping`
 * 2) Собирает технологии из `documents`
 * 3) Сохраняет специальные и технологии в БД (upsert), возвращает их id
 * 4) Создаёт связи технология ↔ специальность согласно `technologyMapping`
 * 
 * @param params.client Клиент PostgreSQL (только query)
 * @param params.documents Список документов
 * @param params.technologyMapping Маппинг технологий в специальности
 * @param params.specialtyMapping Маппинг специальностей (приоритеты/описания)
 * @param params.debug Доп. логи
 * 
 * @returns Карты идентификаторов: `specialtyIds`, `technologyIds`
 * 
 * @example
 * const { specialtyIds, technologyIds } = await collectAndSaveEntities({
 *   client,
 *   documents,
 *   technologyMapping,
 *   specialtyMapping,
 *   debug: process.env.DEBUG_SAVE === '1',
 * });
 */
export async function collectAndSaveEntities(
    { client, documents, technologyMapping, specialtyMapping, debug = false }: TCollectAndSaveEntities,
): Promise<TCollectAndSaveEntitiesResult> {
    const specialties = new Map<string, NamedEntity>();
    const technologies = new Map<string, NamedEntity>();

    // Собираем специальности из specialtyMapping
    if (specialtyMapping) {
        if (debug) console.log('Обрабатываем specialtyMapping для создания специальностей');

        for (const [specialtyName, specialtyConfig] of Object.entries(specialtyMapping)) {
            if (debug) console.log(`Специальность: ${specialtyName}, Конфиг:`, specialtyConfig);

            specialties.set(
                specialtyName,
                createSpecialty(specialtyName, specialtyConfig.priority || 0)
            );

            if (debug) console.log(`Добавлена специальность ${specialtyName}`);
        }
    }

    // Собираем специальности из technologyMapping
    if (technologyMapping) {
        if (debug) console.log('Обрабатываем technologyMapping для создания специальностей');

        for (const [techName, techMapping] of Object.entries(technologyMapping)) {
            if (debug) console.log(`Технология: ${techName}, Маппинг:`, techMapping);

            const specialtiesList = toStringArray(techMapping?.specialty);

            for (const specialty of specialtiesList) {
                if (!specialties.has(specialty)) {
                    specialties.set(
                        specialty,
                        createSpecialty(specialty, techMapping?.priority || 0)
                    );

                    if (debug) console.log(`Добавлена специальность ${specialty}`);
                }
            }
        }
    }

    // Собираем технологии из documents
    for (const doc of documents) {
        if (!technologies.has(doc.technology)) {
            technologies.set(
                doc.technology,
                createTechnology(doc.technology, doc.priority)
            );
        }
    }

    if (debug) {
        console.log(`Найдено специальностей: ${specialties.size}`);
        console.log(`Найдено технологий: ${technologies.size}`);
    }

    // Сохраняем специальности в базу данных
    const specialtyIds = await saveSpecialties({ client, specialties, debug });

    // Сохраняем технологии в базу данных
    const technologyIds = await saveTechnologies({ client, technologies, debug });

    // Создаем связи между технологиями и специальностями
    await createTechnologySpecialtyLinks({ client, technologyMapping, specialtyIds, technologyIds, technologies, debug });

    return { specialtyIds, technologyIds };
}
