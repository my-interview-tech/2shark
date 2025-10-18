import { PoolClient } from 'pg';
import { DocItem, TechnologyMapping } from '../../../types';

export type TSaveArticles = {
    client: PoolClient;
    documents: DocItem[];
    specialtyIds: Map<string, number>;
    technologyIds: Map<string, number>;
    technologyMapping?: TechnologyMapping;
    debug?: boolean;
};
