import { DESCRIBE_CASES } from '../../helpers/test';
import { SCHEMA } from '../../schema';
import { reconcilePublishedRevision } from './reconcilePublishedRevision';

describe('Unit/import/function/reconcilePublishedRevision', () => {
  const client = {
    query: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe(DESCRIBE_CASES.SUCCESS, () => {
    it('Должна архивировать uid, отсутствующие в importedUids', async () => {
      client.query
        .mockResolvedValueOnce({ rows: [{ uid: 'uid-1' }, { uid: 'uid-2' }, { uid: 'uid-3' }] })
        .mockResolvedValueOnce({ rowCount: 2 });

      const archivedCount = await reconcilePublishedRevision(client as any, {
        importJobId: '42',
        branch: 'main',
        commitSha: 'abc123',
        importedUids: ['uid-1'],
      });

      expect(archivedCount).toBe(2);
      expect(client.query).toHaveBeenNthCalledWith(1, SCHEMA.SELECT_ACTIVE_ARTICLE_UIDS_QUERY);
      expect(client.query).toHaveBeenNthCalledWith(2, SCHEMA.ARCHIVE_ARTICLES_BY_UIDS_QUERY, ['42', ['uid-2', 'uid-3']]);
    });

    it('Должна возвращать 0, если нет uid для архивации', async () => {
      client.query.mockResolvedValueOnce({ rows: [{ uid: 'uid-1' }] });

      const archivedCount = await reconcilePublishedRevision(client as any, {
        importJobId: '42',
        branch: 'main',
        commitSha: 'abc123',
        importedUids: ['uid-1'],
      });

      expect(archivedCount).toBe(0);
      expect(client.query).toHaveBeenCalledTimes(1);
    });
  });

  describe(DESCRIBE_CASES.ERROR, () => {
    it('Должна вернуть ошибку для non-main ветки', async () => {
      await expect(
        reconcilePublishedRevision(client as any, {
          importJobId: '42',
          branch: 'master',
          commitSha: 'abc123',
          importedUids: ['uid-1'],
        }),
      ).rejects.toThrow('только для branch=main');
    });

    it('Должна вернуть ошибку для пустого imported uid set', async () => {
      await expect(
        reconcilePublishedRevision(client as any, {
          importJobId: '42',
          branch: 'main',
          commitSha: 'abc123',
          importedUids: [],
        }),
      ).rejects.toThrow('Пустой imported uid set запрещен');
    });
  });
});
