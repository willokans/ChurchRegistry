import { createHolyOrder } from '@/lib/api';
import { enqueueOfflineSubmission, getOfflineQueueItem } from '@/lib/offline/queue';
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

describe('offline replay auth handling', () => {
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

  it('marks item queued with auth-required marker and stops replay for later items', async () => {
    (createHolyOrder as jest.Mock)
      .mockRejectedValueOnce(new Error('Unauthorized'))
      .mockResolvedValueOnce({ id: 2 });

    const firstId = await enqueueOfflineSubmission({
      kind: 'holy_order_create',
      payload: {
        confirmationId: 1,
        ordinationDate: '2026-03-20',
        orderType: 'DEACON',
        officiatingBishop: 'Bishop X',
        parishId: undefined,
      },
    });

    const secondId = await enqueueOfflineSubmission({
      kind: 'holy_order_create',
      payload: {
        confirmationId: 2,
        ordinationDate: '2026-03-21',
        orderType: 'PRIEST',
        officiatingBishop: 'Bishop Y',
        parishId: undefined,
      },
    });

    await replayOfflineQueue();

    expect(createHolyOrder).toHaveBeenCalledTimes(1);

    const first = await getOfflineQueueItem(firstId);
    expect(first).not.toBeNull();
    expect(first!.status).toBe('queued');
    expect(first!.lastError).toMatch(/session expired/i);
    expect(typeof first!.replayState?.authRequiredAt).toBe('number');

    const second = await getOfflineQueueItem(secondId);
    expect(second).not.toBeNull();
    expect(second!.status).toBe('queued');
  });
});

