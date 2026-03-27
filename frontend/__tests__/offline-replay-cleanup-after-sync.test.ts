import { createCommunionWithCertificate } from '@/lib/api';
import { saveDraft, loadDraft } from '@/lib/offline/drafts';
import { persistOfflineBlob, loadOfflineBlob } from '@/lib/offline/files';
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

describe('offline replay cleanup after sync', () => {
  const originalIndexedDB = (globalThis as unknown as { indexedDB?: unknown }).indexedDB;

  beforeEach(() => {
    (globalThis as unknown as { indexedDB?: unknown }).indexedDB = undefined;
    window.localStorage.clear();
    Object.defineProperty(window.navigator, 'onLine', { configurable: true, value: true });
    (createCommunionWithCertificate as jest.Mock).mockReset();
    (createCommunionWithCertificate as jest.Mock).mockResolvedValue({ id: 777 });
  });

  afterAll(() => {
    (globalThis as unknown as { indexedDB?: unknown }).indexedDB = originalIndexedDB;
  });

  it('deletes stored blobs and the referenced draft after a successful sync', async () => {
    const draftId = 'unit-test-draft-cleanup-1';
    await saveDraft(draftId, 'communion_create', { form: { hello: 'world' } });

    const fileRefId = 'unit-test-blob-cleanup-1';
    await persistOfflineBlob(new Blob(['cert'], { type: 'application/pdf' }), {
      fileRefId,
      maxBytes: 2 * 1024 * 1024,
    });
    expect(await loadOfflineBlob(fileRefId)).not.toBeNull();
    expect(await loadDraft(draftId)).not.toBeNull();

    const itemId = await enqueueOfflineSubmission(
      {
        kind: 'communion_create',
        payload: {
          baptismSource: 'external',
          effectiveParishId: 1,
          communionRequest: {
            communionDate: '2026-03-20',
            officiatingPriest: 'Priest A',
            parish: 'Test Parish',
          },
          externalBaptism: {
            baptismName: 'Baptism Name',
            surname: 'Surname',
            otherNames: 'Other Names',
            gender: 'MALE',
            fathersName: 'Father',
            mothersName: 'Mother',
            baptisedChurchAddress: 'Address',
          },
          certificateAttachment: {
            fileRefId,
            name: 'baptism.pdf',
            mimeType: 'application/pdf',
            size: 3,
          },
        },
      },
      { draftId }
    );

    await replayOfflineQueue({ onlyItemId: itemId });

    const synced = await getOfflineQueueItem(itemId);
    expect(synced).not.toBeNull();
    expect(synced!.status).toBe('synced');

    // cleanupAfterItemSynced should remove local attachment storage and the draft.
    expect(await loadOfflineBlob(fileRefId)).toBeNull();
    expect(await loadDraft(draftId)).toBeNull();
  });
});

