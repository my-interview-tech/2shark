import { SCHEMA } from '../../../schema';

export const cleanupSteps: Array<{ table: string; query: string }> = [
    { table: 'article_tags', query: SCHEMA.DELETE_ARTICLE_TAGS_DATA_QUERY },
    { table: 'article_links', query: SCHEMA.DELETE_ARTICLE_LINKS_DATA_QUERY },
    { table: 'tags', query: SCHEMA.DELETE_TAGS_DATA_QUERY },
    { table: 'articles', query: SCHEMA.DROP_ARTICLES_TABLE_QUERY },
    { table: 'import_jobs', query: SCHEMA.DELETE_IMPORT_JOBS_DATA_QUERY },
    { table: 'specialties', query: SCHEMA.DELETE_SPECIALTIES_DATA_QUERY },
    { table: 'technologies', query: SCHEMA.DELETE_TECHNOLOGIES_DATA_QUERY },
];

export const createQueries: string[] = [
    SCHEMA.CREATE_SPECIALTIES_TABLE_QUERY,
    SCHEMA.CREATE_TECHNOLOGIES_TABLE_QUERY,
    SCHEMA.DROP_SPECIALTY_TECHNOLOGY_TABLE_QUERY,
    SCHEMA.CREATE_SPECIALTY_TECHNOLOGY_TABLE_QUERY,
    SCHEMA.CREATE_ARTICLES_TABLE_QUERY,
    SCHEMA.CREATE_TAGS_TABLE_QUERY,
    SCHEMA.CREATE_ARTICLE_TAGS_TABLE_QUERY,
    SCHEMA.CREATE_ARTICLE_LINKS_TABLE_QUERY,
    SCHEMA.CREATE_IMPORT_JOBS_TABLE_QUERY,
];
