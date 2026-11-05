import { DocItem, DatabaseConfig, TechnologyMapping, SpecialtyMapping } from '../types';
import { PoolClient } from 'pg';

/**
 * Тип для сущности с именем, слагом и приоритетом
 */
export interface NamedEntity {
  name: string;
  slug: string;
  priority: number;
}

/**
 * Технология с полями подачи из `category-mapping.yaml`.
 */
export interface TechnologyEntity extends NamedEntity {
  /** Слаг в адресе `/topics/<slug>`; null — технология не публикуется */
  publicSlug: string | null;
  /** Название на сайте */
  title: string;
  /** Иконка, prerequisites, subscribe, context, resources и переопределения chapters */
  meta: Record<string, unknown>;
}

export type TSaveDocuments = {
  documents: DocItem[];
  config?: DatabaseConfig;
  technologyMapping?: TechnologyMapping;
  specialtyMapping?: SpecialtyMapping;
  afterSave?: (params: { client: PoolClient; importedUids: string[] }) => Promise<void>;
};
