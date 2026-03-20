import { createHolyOrder } from '@/lib/api';
import { enqueueOfflineSubmission, getOfflineQueueItem, updateOfflineQueueItemStatus } from '@/lib/offline/queue';
import { loadOfflineBlob, persistOfflineBlob } from '@/lib/offline/files';
import { replayOfflineQueue } from '@/lib/offline/replay';

jest.mock('@/lib/api', () => ({
  createBaptism: jest.fn(),
  createBaptismWithCertificate: jest.fn(),
  createCommunion: jest.fn(),
  createCommunionWithCertificate: jest.fn(),
  createCommunionWithCommunionCertificate: jest.fn(),
  createConfirmation: jest.fn(),
  createMarriageWithParties: jest.fn(),
  createHolyOrder: jest.fn(),
}));

describe('offline replay pruning', () => {
  const originalIndexedDB = (globalThis as unknown as { indexedDB?: unknown }).indexedDB;

  beforeEach(() => {
    // Force localStorage fallback to keep tests deterministic.
    (globalThis as unknown as { indexedDB?: unknown }).indexedDB = undefined;
    window.localStorage.clear();

    // Ensure replay sees we're online.
    Object.defineProperty(window.navigator, 'onLine', { configurable: true, value: true });

    (createHolyOrder as jest.Mock).mockReset();
    (createHolyOrder as jest.Mock).mockResolvedValue({ id: 123 });
  });

  afterAll(() => {
    (globalThis as unknown as { indexedDB?: unknown }).indexedDB = originalIndexedDB;
  });

  function localQueueItemKey(itemId: string) {
    return `church_registry_offline_queue_item:${itemId}`;
  }

  async function setQueueItemStorage(itemId: string, patch: Record<string, unknown>) {
    const key = localQueueItemKey(itemId);
    const raw = window.localStorage.getItem(key);
    if (!raw) throw new Error(`Missing local queue item in storage: ${itemId}`);
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    window.localStorage.setItem(key, JSON.stringify({ ...parsed, ...patch }));
  }

  it('prunes stale failed/synced items and orphan blobs (keeps referenced blobs)', async () => {
    const now = Date.now();
    const old = now - 30 * 24 * 60 * 60 * 1000; // safely older than all pruning TTLs

    // Orphan blob: not referenced by any surviving queue item/draft.
    await persistOfflineBlob(new Blob(['orphan'], { type: 'application/pdf' }), { fileRefId: 'orphan-blob-1' });
    {
      const key = `church_registry_offline_file:orphan-blob-1`;
      const raw = window.localStorage.getItem(key);
      if (!raw) throw new Error('Missing orphan blob storage');
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      window.localStorage.setItem(key, JSON.stringify({ ...parsed, updatedAt: old, storedBlob: true }));
    }

    // Keep blob: referenced by a non-stale queue item, so it should not be deleted.
    await persistOfflineBlob(new Blob(['keep'], { type: 'application/pdf' }), { fileRefId: 'keep-blob-1' });
    {
      const key = `church_registry_offline_file:keep-blob-1`;
      const raw = window.localStorage.getItem(key);
      if (!raw) throw new Error('Missing keep blob storage');
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      window.localStorage.setItem(key, JSON.stringify({ ...parsed, updatedAt: old, storedBlob: true }));
    }

    // This is the item that replayOfflineQueue will actively sync.
    const replayItemId = await enqueueOfflineSubmission({
      kind: 'holy_order_create',
      payload: {
        confirmationId: 1,
        ordinationDate: '2026-03-20',
        orderType: 'DEACON',
        officiatingBishop: 'Bishop X',
        parishId: undefined,
      },
    });

    // Non-stale synced queue item referencing keep-blob-1.
    const keepReferencedItemId = await enqueueOfflineSubmission({
      kind: 'communion_create',
      payload: {
        baptismSource: 'external',
        certificateAttachment: {
          fileRefId: 'keep-blob-1',
          name: 'comm-un.pdf',
          mimeType: 'application/pdf',
          size: 123,
        },
      },
    });
    await updateOfflineQueueItemStatus(keepReferencedItemId, 'synced');

    // Stale failed queue item (should be deleted by pruning).
    const staleFailedItemId = await enqueueOfflineSubmission({
      kind: 'communion_create',
      payload: {
        baptismSource: 'external',
        certificateAttachment: { fileRefId: 'some-other-blob' },
      },
    });
    await updateOfflineQueueItemStatus(staleFailedItemId, 'failed');
    await setQueueItemStorage(staleFailedItemId, { updatedAt: old });

    // Stale synced queue item (should also be deleted by pruning).
    const staleSyncedItemId = await enqueueOfflineSubmission({
      kind: 'communion_create',
      payload: {
        baptismSource: 'external',
        certificateAttachment: { fileRefId: 'another-other-blob' },
      },
    });
    await updateOfflineQueueItemStatus(staleSyncedItemId, 'synced');
    await setQueueItemStorage(staleSyncedItemId, { updatedAt: old });

    await replayOfflineQueue({ onlyItemId: replayItemId });

    // Stale queue items should be gone.
    expect(await getOfflineQueueItem(staleFailedItemId)).toBeNull();
    expect(await getOfflineQueueItem(staleSyncedItemId)).toBeNull();

    // Orphan blob should be deleted.
    expect(await loadOfflineBlob('orphan-blob-1')).toBeNull();

    // Referenced blob should remain.
    expect(await loadOfflineBlob('keep-blob-1')).not.toBeNull();

    // Referencing queue item should remain because it's not stale.
    const keepReferenced = await getOfflineQueueItem(keepReferencedItemId);
    expect(keepReferenced).not.toBeNull();
    expect(keepReferenced!.status).toBe('synced');
  });
});

