import { NamedEntity, TechnologyEntity } from "../../types";
import { TechnologyMapping } from "../../../types";
import { getPublicSlug } from "../../../helpers/toAnchor";
import { toSlug } from "../utils";

/**
 * Создает сущность (специальность или технологию) из имени и приоритета.
 *
 * @param name - Название сущности
 * @param priority - Приоритет (по умолчанию 0)
 * @returns NamedEntity с name, slug и priority
 *
 * @example
 * const specialty = createNamedEntity('Frontend', 1);
 * const technology = createNamedEntity('React', 5);
 */
export const createNamedEntity = (name: string, priority = 0): NamedEntity => {
    return {
        name,
        slug: toSlug(name),
        priority,
    };
}

const META_KEYS = ['icon', 'kind', 'prerequisites', 'subscribe', 'context', 'resources', 'chapters'] as const;

/**
 * Создает технологию с полями подачи из YAML.
 *
 * Без `slug` в YAML технология не публикуется (`publicSlug = null`), без `title` название совпадает с именем.
 *
 * @param name - Имя технологии из frontmatter (`JSCore`)
 * @param priority - Приоритет
 * @param mapping - Запись технологии из `category-mapping.yaml`
 * @returns TechnologyEntity для upsert
 *
 * @example
 * createTechnologyEntity('JSCore', 3, { slug: 'javascript', title: 'JavaScript', ... });
 * // { name: 'JSCore', slug: 'jscore', publicSlug: 'javascript', title: 'JavaScript', ... }
 */
export const createTechnologyEntity = (
    name: string,
    priority = 0,
    mapping?: TechnologyMapping[string],
): TechnologyEntity => {
    const meta: Record<string, unknown> = {};

    for (const key of META_KEYS) {
        if (mapping?.[key] !== undefined) meta[key] = mapping[key];
    }

    return {
        ...createNamedEntity(name, priority),
        publicSlug: getPublicSlug(mapping?.slug),
        title: mapping?.title?.trim() || name,
        meta,
    };
}

// Обратная совместимость
export const createSpecialty = createNamedEntity;
export const createTechnology = createNamedEntity;
