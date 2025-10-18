import { PoolClient } from 'pg';
import { DocItem } from '../../../types';

export type TSaveArticleRelations = {
    client: PoolClient;
    articleId: number;
    doc: DocItem;
    queries: {
        insertTag: string;
        insertArticleTag: string;
        insertArticleLink: string;
    };
    debug?: boolean;
};