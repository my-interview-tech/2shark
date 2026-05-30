import { PoolClient } from 'pg';
import { SCHEMA } from '../../schema';
import { TImportJob, TImportJobError, TImportJobResult } from '../../types';

type TJobsClient = Pick<PoolClient, 'query'>;

export async function createImportJob(
  client: TJobsClient,
  params: { branch: string; commitSha: string },
): Promise<string> {
  const result = await client.query(SCHEMA.INSERT_IMPORT_JOB_QUERY, [params.branch, params.commitSha]);
  return String(result.rows[0].id);
}

export async function markImportJobRunning(client: TJobsClient, importJobId: string): Promise<void> {
  await client.query(SCHEMA.UPDATE_IMPORT_JOB_RUNNING_QUERY, [importJobId]);
}

export async function markImportJobSuccess(
  client: TJobsClient,
  importJobId: string,
  result: TImportJobResult,
): Promise<void> {
  await client.query(SCHEMA.UPDATE_IMPORT_JOB_SUCCESS_QUERY, [importJobId, JSON.stringify(result)]);
}

export async function markImportJobFailed(
  client: TJobsClient,
  importJobId: string,
  error: TImportJobError,
): Promise<void> {
  await client.query(SCHEMA.UPDATE_IMPORT_JOB_FAILED_QUERY, [importJobId, JSON.stringify(error)]);
}

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
