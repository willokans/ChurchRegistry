import { createHolyOrder } from '@/lib/api';
import type { HolyOrderRequest } from '@/lib/api';
import { enqueueOfflineSubmission, getOfflineQueueItem } from '@/lib/offline/queue';
import { replayOfflineQueue, retryOfflineQueueItem } from '@/lib/offline/replay';

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

describe('offline replay module', () => {
  const originalIndexedDB = (globalThis as unknown as { indexedDB?: unknown }).indexedDB;

  beforeEach(() => {
    // Force localStorage fallback to keep tests deterministic.
    (globalThis as unknown as { indexedDB?: unknown }).indexedDB = undefined;
    window.localStorage.clear();

    // Ensure replay sees we're online.
    Object.defineProperty(window.navigator, 'onLine', { configurable: true, value: true });

    (createHolyOrder as jest.Mock).mockReset();
  });

  afterAll(() => {
    (globalThis as unknown as { indexedDB?: unknown }).indexedDB = originalIndexedDB;
  });

  it('replays a queued holy order and marks it synced', async () => {
    (createHolyOrder as jest.Mock).mockResolvedValue({ id: 1 });

    const payload: HolyOrderRequest = {
      confirmationId: 1,
      ordinationDate: '2026-03-20',
      orderType: 'DEACON',
      officiatingBishop: 'Bishop X',
      parishId: undefined,
    };

    const itemId = await enqueueOfflineSubmission({
      kind: 'holy_order_create',
      payload,
    });

    await replayOfflineQueue({ onlyItemId: itemId });

    const updated = await getOfflineQueueItem(itemId);
    expect(updated).not.toBeNull();
    expect(updated!.status).toBe('synced');
    expect(createHolyOrder).toHaveBeenCalledTimes(1);
    expect(createHolyOrder).toHaveBeenCalledWith(payload);
  });

  it('marks item as failed when replay throws, and retry increments retryCount', async () => {
    (createHolyOrder as jest.Mock).mockRejectedValueOnce(new Error('Boom'));
    (createHolyOrder as jest.Mock).mockResolvedValueOnce({ id: 2 });

    const payload: HolyOrderRequest = {
      confirmationId: 2,
      ordinationDate: '2026-03-20',
      orderType: 'PRIEST',
      officiatingBishop: 'Bishop Y',
      parishId: undefined,
    };

    const itemId = await enqueueOfflineSubmission({
      kind: 'holy_order_create',
      payload,
    });

    await replayOfflineQueue({ onlyItemId: itemId });
    const failed = await getOfflineQueueItem(itemId);
    expect(failed).not.toBeNull();
    expect(failed!.status).toBe('failed');
    expect(failed!.lastError).toContain('Boom');
    expect(failed!.retryCount).toBe(0);

    await retryOfflineQueueItem(itemId);

    const synced = await getOfflineQueueItem(itemId);
    expect(synced).not.toBeNull();
    expect(synced!.status).toBe('synced');
    expect(synced!.retryCount).toBe(1);
    expect(createHolyOrder).toHaveBeenCalledTimes(2);
  });
});

