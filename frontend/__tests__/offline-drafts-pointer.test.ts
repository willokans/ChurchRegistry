import { loadDraft, loadDraftMeta, saveDraft } from '@/lib/offline/drafts';

describe('offline drafts pointer metadata', () => {
  const originalIndexedDB = (globalThis as unknown as { indexedDB?: unknown }).indexedDB;

  beforeEach(() => {
    // Force localStorage fallback to keep tests deterministic.
    (globalThis as unknown as { indexedDB?: unknown }).indexedDB = undefined;
    window.localStorage.clear();
  });

  afterAll(() => {
    (globalThis as unknown as { indexedDB?: unknown }).indexedDB = originalIndexedDB;
  });

  it('stores and loads draft meta via loadDraftMeta()', async () => {
    const draftId = 'unit-test-draft-pointer-1';
    const formType = 'confirmation_create';
    const payload = { hello: 'world' };

    await saveDraft(draftId, formType, payload);

    const meta = await loadDraftMeta(draftId);
    expect(meta).not.toBeNull();
    expect(meta).toEqual(
      expect.objectContaining({
        draftId,
        formType,
      })
    );
    expect(meta!.updatedAt).toBeGreaterThan(0);

    const loaded = await loadDraft<typeof payload>(draftId);
    expect(loaded).not.toBeNull();
    expect(loaded).toEqual(
      expect.objectContaining({
        draftId,
        id: draftId,
        formType,
        payload,
      })
    );
  });
});

