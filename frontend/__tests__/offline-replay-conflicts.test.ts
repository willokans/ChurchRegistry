import { createCommunion, fetchCommunionByBaptismId } from '@/lib/api';
import { enqueueOfflineSubmission, getOfflineQueueItem, updateOfflineQueueItemStatus } from '@/lib/offline/queue';
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

describe('offline replay conflicts', () => {
  const originalIndexedDB = (globalThis as unknown as { indexedDB?: unknown }).indexedDB;

  beforeEach(() => {
    (globalThis as unknown as { indexedDB?: unknown }).indexedDB = undefined;
    window.localStorage.clear();
    Object.defineProperty(window.navigator, 'onLine', { configurable: true, value: true });

    (createCommunion as jest.Mock).mockReset();
    (fetchCommunionByBaptismId as jest.Mock).mockReset();
  });

  afterAll(() => {
    (globalThis as unknown as { indexedDB?: unknown }).indexedDB = originalIndexedDB;
  });

  it('marks a queue item failed with conflict marker and allows server-resolution replay', async () => {
    (createCommunion as jest.Mock).mockRejectedValueOnce(new Error('First holy communion already exists for this baptism'));
    (fetchCommunionByBaptismId as jest.Mock).mockResolvedValueOnce({ id: 999 });

    const itemId = await enqueueOfflineSubmission({
      kind: 'communion_create',
      payload: {
        baptismSource: 'this_church',
        baptismId: 5,
        communionRequest: {
          communionDate: '2026-03-20',
          officiatingPriest: 'Priest A',
          parish: 'Test Parish',
        },
      },
    });

    await replayOfflineQueue({ onlyItemId: itemId });

    const failed = await getOfflineQueueItem(itemId);
    expect(failed).not.toBeNull();
    expect(failed!.status).toBe('failed');
    expect(failed!.replayState?.conflict).toEqual(
      expect.objectContaining({
        kind: 'communion_already_exists_for_baptism',
        stepKey: 'communion_create.this_church.done',
        message: expect.any(String),
      })
    );

    // Resolve conflict by switching to queued with server choice.
    const conflict = failed!.replayState!.conflict!;
    await updateOfflineQueueItemStatus(itemId, 'queued', {
      lastError: undefined,
      replayState: {
        ...(failed!.replayState ?? {}),
        conflict: { ...conflict, resolvedChoice: 'server' },
      },
    });

    await replayOfflineQueue({ onlyItemId: itemId });

    const synced = await getOfflineQueueItem(itemId);
    expect(synced).not.toBeNull();
    expect(synced!.status).toBe('synced');
    expect(synced!.replayState?.conflict).toBeUndefined();

    // Server-resolution path should fetch existing record and should not attempt creation again.
    expect(createCommunion).toHaveBeenCalledTimes(1);
    expect(fetchCommunionByBaptismId).toHaveBeenCalledTimes(1);
  });
});

