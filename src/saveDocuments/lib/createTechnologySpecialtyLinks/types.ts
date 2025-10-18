import { PoolClient } from 'pg';
import { TechnologyMapping } from '../../../types';
import { NamedEntity } from '../../types';

export type TCreateTechnologySpecialtyLinks = {
    client: PoolClient;
    technologyMapping: TechnologyMapping | undefined;
    specialtyIds: Map<string, number>;
    technologyIds: Map<string, number>;
    technologies: Map<string, NamedEntity>;
    debug?: boolean;
};
