import { PoolClient } from 'pg';
import { SCHEMA } from '../../schema';

type TReconcilePublishedRevisionInput = {
  importJobId: string;
  branch: string;
  commitSha: string;
  importedUids: string[];
};

type TReconcileClient = Pick<PoolClient, 'query'>;

/**
 * Архивирует статьи production read model, которые отсутствуют в импортированной published revision.
 *
 * Reconcile разрешен только для `branch=main`: он сравнивает активные `articles.uid`
 * с uid документов текущего импорта и помечает отсутствующие записи как `is_deleted=true`.
 *
 * @param client - PostgreSQL client с методом `query`.
 * @param input - Import job metadata и список uid, найденных в текущей revision.
 * @returns Количество архивированных статей.
 * @throws Если branch не `main`, commitSha пустой или список импортированных uid пуст.
 */
export async function reconcilePublishedRevision(
  client: TReconcileClient,
  input: TReconcilePublishedRevisionInput,
): Promise<number> {
  const { branch, importedUids, importJobId, commitSha } = input;

  if (branch !== 'main') {
    throw new Error('Archive reconcile разрешен только для branch=main');
  }

  if (!commitSha) {
    throw new Error('Archive reconcile требует commitSha');
  }

  const normalizedImportedUids = Array.from(new Set(importedUids.map((uid) => uid.trim()).filter(Boolean)));

  if (normalizedImportedUids.length === 0) {
    throw new Error('Пустой imported uid set запрещен для production archive reconcile');
  }

  const activeRows = await client.query<{ uid: string }>(SCHEMA.SELECT_ACTIVE_ARTICLE_UIDS_QUERY);
  const importedSet = new Set(normalizedImportedUids);
  const missingUids = activeRows.rows
    .map((row) => row.uid)
    .filter((uid) => !importedSet.has(uid));

  if (missingUids.length === 0) {
    return 0;
  }

  const archiveResult = await client.query(SCHEMA.ARCHIVE_ARTICLES_BY_UIDS_QUERY, [importJobId, missingUids]);
  return archiveResult.rowCount || 0;
}
