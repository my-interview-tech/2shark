import { NamedEntity } from "../../types";
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

// Обратная совместимость
export const createSpecialty = createNamedEntity;
export const createTechnology = createNamedEntity;
