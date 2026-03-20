import { createBaptismWithCertificate, createCommunion, createConfirmation, createHolyOrder } from '@/lib/api';
import type { HolyOrderRequest } from '@/lib/api';
import { enqueueOfflineSubmission, getOfflineQueueItem, updateOfflineQueueItemStatus } from '@/lib/offline/queue';
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
    (createBaptismWithCertificate as jest.Mock).mockReset();
    (createCommunion as jest.Mock).mockReset();
    (createConfirmation as jest.Mock).mockReset();
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

  it('resumes confirmation replay: skips baptism+only creates communion+confirmation', async () => {
    (createCommunion as jest.Mock).mockResolvedValue({ id: 10 });
    (createConfirmation as jest.Mock).mockResolvedValue({ id: 20 });

    const payload = {
      effectiveParishId: 1,
      effectiveParishName: 'Test Parish',
      externalCommunion: {
        communionDate: '2026-03-20',
        officiatingPriest: 'Priest A',
      },
      branch: {
        type: 'external_baptism',
        externalBaptism: {
          baptismName: 'Baptism Name',
          surname: 'Surname',
          otherNames: 'Other Names',
          gender: 'MALE',
          fathersName: "Father",
          mothersName: "Mother",
          baptisedChurchAddress: 'Address',
        },
        baptismCertificateAttachment: {
          fileRefId: 'baptism-cert-1',
          name: 'baptism.pdf',
          mimeType: 'application/pdf',
          size: 123,
        },
        communionSource: 'this_church',
      },
      form: {
        confirmationDate: '2026-03-21',
        officiatingBishop: 'Bishop Z',
        parish: 'Test Parish',
      },
    } as any;

    const itemId = await enqueueOfflineSubmission({
      kind: 'confirmation_create',
      payload,
    });

    // Reset status to queued with the completed baptism step.
    // Step keys are defined in `frontend/lib/offline/replay.ts`.
    const baptismDoneKey = 'confirmation.external_baptism.baptism.done';
    await updateOfflineQueueItemStatus(itemId, 'queued', {
      replayState: {
        steps: { [baptismDoneKey]: Date.now() },
        createdBaptismId: 123,
        baptismCertificatePath: '/server/path/baptism-cert.pdf',
      },
    });

    await replayOfflineQueue({ onlyItemId: itemId });

    expect(createBaptismWithCertificate).not.toHaveBeenCalled();
    expect(createCommunion).toHaveBeenCalledTimes(1);
    expect(createCommunion).toHaveBeenCalledWith(
      expect.objectContaining({
        baptismId: 123,
        communionDate: payload.externalCommunion.communionDate,
        officiatingPriest: payload.externalCommunion.officiatingPriest,
        parish: payload.effectiveParishName,
        baptismCertificatePath: '/server/path/baptism-cert.pdf',
      })
    );
    expect(createConfirmation).toHaveBeenCalledTimes(1);
    expect(createConfirmation).toHaveBeenCalledWith({
      baptismId: 123,
      communionId: 10,
      confirmationDate: payload.form.confirmationDate,
      officiatingBishop: payload.form.officiatingBishop,
      parish: payload.form.parish,
    });
  });

  it('resumes confirmation replay: skips communion+only creates confirmation', async () => {
    (createConfirmation as jest.Mock).mockResolvedValue({ id: 21 });

    const payload = {
      effectiveParishId: 1,
      effectiveParishName: 'Test Parish',
      externalCommunion: {
        communionDate: '2026-03-20',
        officiatingPriest: 'Priest A',
      },
      branch: {
        type: 'external_baptism',
        externalBaptism: {
          baptismName: 'Baptism Name',
          surname: 'Surname',
          otherNames: 'Other Names',
          gender: 'MALE',
          fathersName: "Father",
          mothersName: "Mother",
          baptisedChurchAddress: 'Address',
        },
        baptismCertificateAttachment: {
          fileRefId: 'baptism-cert-1',
          name: 'baptism.pdf',
          mimeType: 'application/pdf',
          size: 123,
        },
        communionSource: 'this_church',
      },
      form: {
        confirmationDate: '2026-03-21',
        officiatingBishop: 'Bishop Z',
        parish: 'Test Parish',
      },
    } as any;

    const itemId = await enqueueOfflineSubmission({
      kind: 'confirmation_create',
      payload,
    });

    const baptismDoneKey = 'confirmation.external_baptism.baptism.done';
    const communionDoneKey = 'confirmation.external_baptism.communion.done';
    await updateOfflineQueueItemStatus(itemId, 'queued', {
      replayState: {
        steps: {
          [baptismDoneKey]: Date.now(),
          [communionDoneKey]: Date.now(),
        },
        createdBaptismId: 123,
        baptismCertificatePath: '/server/path/baptism-cert.pdf',
        createdCommunionId: 10,
      },
    });

    await replayOfflineQueue({ onlyItemId: itemId });

    expect(createBaptismWithCertificate).not.toHaveBeenCalled();
    expect(createCommunion).not.toHaveBeenCalled();
    expect(createConfirmation).toHaveBeenCalledTimes(1);
    expect(createConfirmation).toHaveBeenCalledWith({
      baptismId: 123,
      communionId: 10,
      confirmationDate: payload.form.confirmationDate,
      officiatingBishop: payload.form.officiatingBishop,
      parish: payload.form.parish,
    });

    const updated = await getOfflineQueueItem(itemId);
    expect(updated?.status).toBe('synced');
  });
});

