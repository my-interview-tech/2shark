import { PoolClient } from 'pg';
import { TechnologyEntity } from '../../types';

export type TSaveTechnologies = {
  client: PoolClient;
  technologies: Map<string, TechnologyEntity>;
  debug?: boolean;
};
