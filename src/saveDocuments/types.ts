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

export type TSaveDocuments = {
  documents: DocItem[];
  config?: DatabaseConfig;
  technologyMapping?: TechnologyMapping;
  specialtyMapping?: SpecialtyMapping;
  afterSave?: (params: { client: PoolClient; importedUids: string[] }) => Promise<void>;
};
