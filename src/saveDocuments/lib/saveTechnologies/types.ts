import { PoolClient } from 'pg';
import { NamedEntity } from '../../types';

export type TSaveTechnologies = {
  client: PoolClient;
  technologies: Map<string, NamedEntity>;
  debug?: boolean;
};
