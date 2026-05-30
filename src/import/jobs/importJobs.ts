import { PoolClient } from 'pg';
import { SCHEMA } from '../../schema';
import { TImportJob, TImportJobError, TImportJobResult } from '../../types';

type TJobsClient = Pick<PoolClient, 'query'>;

/**
 * Создает import job со статусом `pending`.
 *
 * @param client - PostgreSQL client с методом `query`.
 * @param params - Git revision, для которой запускается импорт.
 * @returns ID созданной import job.
 */
export async function createImportJob(
  client: TJobsClient,
  params: { branch: string; commitSha: string },
): Promise<string> {
  const result = await client.query(SCHEMA.INSERT_IMPORT_JOB_QUERY, [params.branch, params.commitSha]);
  return String(result.rows[0].id);
}

/**
 * Переводит import job в статус `running`.
 *
 * @param client - PostgreSQL client с методом `query`.
 * @param importJobId - ID import job.
 */
export async function markImportJobRunning(client: TJobsClient, importJobId: string): Promise<void> {
  await client.query(SCHEMA.UPDATE_IMPORT_JOB_RUNNING_QUERY, [importJobId]);
}

/**
 * Завершает import job статусом `success` и сохраняет summary результата.
 *
 * @param client - PostgreSQL client с методом `query`.
 * @param importJobId - ID import job.
 * @param result - Итоги импорта для `import_jobs.result`.
 */
export async function markImportJobSuccess(
  client: TJobsClient,
  importJobId: string,
  result: TImportJobResult,
): Promise<void> {
  await client.query(SCHEMA.UPDATE_IMPORT_JOB_SUCCESS_QUERY, [importJobId, JSON.stringify(result)]);
}

/**
 * Завершает import job статусом `failed` и сохраняет нормализованную ошибку.
 *
 * @param client - PostgreSQL client с методом `query`.
 * @param importJobId - ID import job.
 * @param error - Ошибка для `import_jobs.error`.
 */
export async function markImportJobFailed(
  client: TJobsClient,
  importJobId: string,
  error: TImportJobError,
): Promise<void> {
  await client.query(SCHEMA.UPDATE_IMPORT_JOB_FAILED_QUERY, [importJobId, JSON.stringify(error)]);
}

/**
 * Возвращает последнюю успешно завершенную import job.
 *
 * @param client - PostgreSQL client с методом `query`.
 * @returns Последняя `success` job или `null`, если успешных запусков еще нет.
 */
export async function getLastSuccessfulImportJob(client: TJobsClient): Promise<TImportJob | null> {
  const result = await client.query(SCHEMA.SELECT_LAST_SUCCESS_IMPORT_JOB_QUERY);
  const row = result.rows[0];

  if (!row) {
    return null;
  }

  return {
    id: String(row.id),
    branch: row.branch,
    commitSha: row.commit_sha,
    status: row.status,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    result: row.result,
    error: row.error,
  };
}
