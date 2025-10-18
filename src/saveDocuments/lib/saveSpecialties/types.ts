import { PoolClient } from 'pg';
import { NamedEntity } from '../../types';

export type TSaveSpecialties = {
    client: PoolClient;
    specialties: Map<string, NamedEntity>;
    debug?: boolean;
};
