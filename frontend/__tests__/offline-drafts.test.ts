import { deleteDraft, loadDraft, saveDraft } from '@/lib/offline/drafts';

describe('offline drafts module', () => {
  const originalIndexedDB = (globalThis as unknown as { indexedDB?: unknown }).indexedDB;

  beforeEach(() => {
    // Force localStorage fallback to keep tests deterministic.
    (globalThis as unknown as { indexedDB?: unknown }).indexedDB = undefined;
    window.localStorage.clear();
  });

  afterAll(() => {
    (globalThis as unknown as { indexedDB?: unknown }).indexedDB = originalIndexedDB;
  });

  it('saves/loads/deletes via localStorage when IndexedDB is unavailable', async () => {
    const id = 'unit-test-draft';
    const formType = 'baptism_create';
    const payload = { hello: 'world', n: 123 };

    await saveDraft(id, formType, payload);

    const raw = window.localStorage.getItem(`church_registry_offline_draft:${id}`);
    expect(raw).not.toBeNull();

    const loaded = await loadDraft<typeof payload>(id);
    expect(loaded).not.toBeNull();
    expect(loaded).toEqual(
      expect.objectContaining({
        id,
        formType,
        payload,
      }),
    );
    expect(loaded!.updatedAt).toBeGreaterThan(0);

    await deleteDraft(id);
    await expect(loadDraft<typeof payload>(id)).resolves.toBeNull();
    expect(window.localStorage.getItem(`church_registry_offline_draft:${id}`)).toBeNull();
  });

  it('returns null when there is no stored draft', async () => {
    await expect(loadDraft<{ any: string }>('missing-id')).resolves.toBeNull();
  });

  it('returns null when stored draft JSON is invalid', async () => {
    const id = 'invalid-json-id';
    window.localStorage.setItem(`church_registry_offline_draft:${id}`, 'not-json');
    await expect(loadDraft<{ any: string }>(id)).resolves.toBeNull();
  });
});

