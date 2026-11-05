import { PoolClient } from 'pg';
import { DocItem } from '../../../types';

export type TSaveArticleRelations = {
    client: PoolClient;
    articleId: number;
    doc: DocItem;
    queries: {
        deleteArticleTags?: string;
        deleteArticleLinks?: string;
        insertTag: string;
        insertArticleTag: string;
        insertArticleLink: string;
    };
    debug?: boolean;
};
