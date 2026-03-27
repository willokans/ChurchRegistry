import {
  deleteOfflineQueueItem,
  enqueueOfflineSubmission,
  getOfflineQueueItem,
  listOfflineQueueItems,
  subscribeToOfflineQueueItem,
  updateOfflineQueueItemStatus,
} from '@/lib/offline/queue';
import type { OfflineQueueItemStatus } from '@/lib/offline/queue';

describe('offline submission queue module', () => {
  const originalIndexedDB = (globalThis as unknown as { indexedDB?: unknown }).indexedDB;

  beforeEach(() => {
    // Force localStorage fallback to keep tests deterministic.
    (globalThis as unknown as { indexedDB?: unknown }).indexedDB = undefined;
    window.localStorage.clear();
  });

  afterAll(() => {
    (globalThis as unknown as { indexedDB?: unknown }).indexedDB = originalIndexedDB;
  });

  it('enqueues offline submissions and lists by status', async () => {
    const itemId = await enqueueOfflineSubmission({
      kind: 'holy_order_create',
      payload: { confirmationId: 1, ordinationDate: '2026-03-20', orderType: 'DEACON', officiatingBishop: 'Bishop X' },
    });

    const item = await getOfflineQueueItem(itemId);
    expect(item).not.toBeNull();
    expect(item!.id).toBe(itemId);
    expect(item!.status).toBe('queued');
    expect(item!.retryCount).toBe(0);

    const queued = await listOfflineQueueItems({ status: 'queued' });
    expect(queued.some((q) => q.id === itemId)).toBe(true);
  });

  it('updates status, stores lastError, and increments retryCount when requested', async () => {
    const itemId = await enqueueOfflineSubmission({
      kind: 'holy_order_create',
      payload: { confirmationId: 1, ordinationDate: '2026-03-20', orderType: 'DEACON', officiatingBishop: 'Bishop X' },
    });

    const updated = await updateOfflineQueueItemStatus(itemId, 'failed', { lastError: 'Boom', incrementRetry: true });
    expect(updated).not.toBeNull();
    expect(updated!.status).toBe('failed');
    expect(updated!.lastError).toBe('Boom');
    expect(updated!.retryCount).toBe(1);

    const queued = await listOfflineQueueItems({ status: 'queued' });
    expect(queued.some((q) => q.id === itemId)).toBe(false);
  });

  it('dispatches per-item status updates to subscribers', async () => {
    const itemId = await enqueueOfflineSubmission({
      kind: 'holy_order_create',
      payload: { confirmationId: 1, ordinationDate: '2026-03-20', orderType: 'DEACON', officiatingBishop: 'Bishop X' },
    });

    const seen: OfflineQueueItemStatus[] = [];
    const unsubscribe = subscribeToOfflineQueueItem(itemId, (item) => seen.push(item.status));

    await updateOfflineQueueItemStatus(itemId, 'syncing');
    await updateOfflineQueueItemStatus(itemId, 'synced');

    unsubscribe();

    // Since we subscribe after enqueue, we only guarantee later transitions.
    expect(seen).toContain('syncing');
    expect(seen).toContain('synced');
  });

  it('deletes queue items', async () => {
    const itemId = await enqueueOfflineSubmission({
      kind: 'holy_order_create',
      payload: { confirmationId: 1, ordinationDate: '2026-03-20', orderType: 'DEACON', officiatingBishop: 'Bishop X' },
    });

    await deleteOfflineQueueItem(itemId);
    await expect(getOfflineQueueItem(itemId)).resolves.toBeNull();
  });
});

