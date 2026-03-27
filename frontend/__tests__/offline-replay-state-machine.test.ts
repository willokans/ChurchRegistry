import { createHolyOrder } from '@/lib/api';
import { enqueueOfflineSubmission, subscribeToOfflineQueueItem } from '@/lib/offline/queue';
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
  fetchCommunionByBaptismId: jest.fn(),
  fetchConfirmationByCommunionId: jest.fn(),
  fetchMarriageByBaptismId: jest.fn(),
  fetchMarriageByConfirmationId: jest.fn(),
  fetchHolyOrderByConfirmationId: jest.fn(),
}));

describe('offline replay state machine', () => {
  const originalIndexedDB = (globalThis as unknown as { indexedDB?: unknown }).indexedDB;

  beforeEach(() => {
    (globalThis as unknown as { indexedDB?: unknown }).indexedDB = undefined;
    window.localStorage.clear();
    Object.defineProperty(window.navigator, 'onLine', { configurable: true, value: true });
    (createHolyOrder as jest.Mock).mockReset();
  });

  afterAll(() => {
    (globalThis as unknown as { indexedDB?: unknown }).indexedDB = originalIndexedDB;
  });

  it('transitions queued -> syncing -> synced for a replay run', async () => {
    (createHolyOrder as jest.Mock).mockResolvedValue({ id: 1 });

    const itemId = await enqueueOfflineSubmission({
      kind: 'holy_order_create',
      payload: {
        confirmationId: 1,
        ordinationDate: '2026-03-20',
        orderType: 'DEACON',
        officiatingBishop: 'Bishop X',
        parishId: undefined,
      },
    });

    const seen: string[] = [];
    const unsubscribe = subscribeToOfflineQueueItem(itemId, (item) => {
      seen.push(item.status);
    });

    await replayOfflineQueue({ onlyItemId: itemId });
    unsubscribe();

    expect(seen).toContain('syncing');
    expect(seen).toContain('synced');
    expect(seen.indexOf('syncing')).toBeLessThan(seen.indexOf('synced'));
  });
});

