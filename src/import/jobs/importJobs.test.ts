import {
  createImportJob,
  markImportJobRunning,
  markImportJobSuccess,
  markImportJobFailed,
  getLastSuccessfulImportJob,
} from './importJobs';
import { DESCRIBE_CASES } from '../../helpers/test';

describe('Unit/import/function/importJobs', () => {
  const client = {
    query: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe(DESCRIBE_CASES.SUCCESS, () => {
    it('Должна создать import job со статусом pending', async () => {
      client.query.mockResolvedValue({ rows: [{ id: 42 }] });

      const id = await createImportJob(client as any, {
        branch: 'master',
        commitSha: 'abc123',
      });

      expect(id).toBe('42');
      expect(client.query).toHaveBeenCalled();
    });

    it('Должна перевести job в running', async () => {
      client.query.mockResolvedValue({ rows: [] });
      await markImportJobRunning(client as any, '42');
      expect(client.query).toHaveBeenCalled();
    });

    it('Должна сохранить success result', async () => {
      client.query.mockResolvedValue({ rows: [] });
      await markImportJobSuccess(client as any, '42', {
        total: 10,
        created: 2,
        updated: 5,
        skipped: 3,
      });
      expect(client.query).toHaveBeenCalled();
    });

    it('Должна сохранить failed error', async () => {
      client.query.mockResolvedValue({ rows: [] });
      await markImportJobFailed(client as any, '42', {
        message: 'Validation failed',
      });
      expect(client.query).toHaveBeenCalled();
    });

    it('Должна вернуть последний успешный job', async () => {
      const startedAt = new Date('2026-01-01T00:00:00.000Z');
      const finishedAt = new Date('2026-01-01T00:01:00.000Z');
      client.query.mockResolvedValue({
        rows: [
          {
            id: 1,
            branch: 'master',
            commit_sha: 'abc123',
            status: 'success',
            started_at: startedAt,
            finished_at: finishedAt,
            result: { total: 1, created: 1, updated: 0, skipped: 0 },
            error: null,
          },
        ],
      });

      const job = await getLastSuccessfulImportJob(client as any);

      expect(job).toEqual({
        id: '1',
        branch: 'master',
        commitSha: 'abc123',
        status: 'success',
        startedAt,
        finishedAt,
        result: { total: 1, created: 1, updated: 0, skipped: 0 },
        error: null,
      });
    });
  });

  describe(DESCRIBE_CASES.EDGE, () => {
    it('Должна вернуть null если успешных jobs нет', async () => {
      client.query.mockResolvedValue({ rows: [] });
      const job = await getLastSuccessfulImportJob(client as any);
      expect(job).toBeNull();
    });
  });
});
