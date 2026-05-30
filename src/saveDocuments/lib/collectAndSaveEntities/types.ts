import { PoolClient } from 'pg';
import { DocItem, SpecialtyMapping, TechnologyMapping } from '../../../types';

export type TCollectAndSaveEntities = {
    client: PoolClient;
    documents: DocItem[];
    technologyMapping?: TechnologyMapping;
    specialtyMapping?: SpecialtyMapping;
    debug?: boolean;
};

export type TCollectAndSaveEntitiesResult = {
    specialtyIds: Map<string, number>;
    technologyIds: Map<string, number>;
};
