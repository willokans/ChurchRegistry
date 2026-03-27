import { loadDraft, saveDraft } from '@/lib/offline/drafts';
import { pruneOfflineResources } from '@/lib/offline/replay';

describe('offline storage hygiene pruning', () => {
  const originalIndexedDB = (globalThis as unknown as { indexedDB?: unknown }).indexedDB;

  beforeEach(() => {
    // Force localStorage fallback to keep tests deterministic.
    (globalThis as unknown as { indexedDB?: unknown }).indexedDB = undefined;
    window.localStorage.clear();

    if (typeof window.navigator !== 'undefined') {
      Object.defineProperty(window.navigator, 'onLine', { configurable: true, value: true });
    }
  });

  afterAll(() => {
    (globalThis as unknown as { indexedDB?: unknown }).indexedDB = originalIndexedDB;
  });

  it('prunes old drafts during storage hygiene', async () => {
    const now = Date.now();
    const old = now - 30 * 24 * 60 * 60 * 1000; // safely older than draft pruning TTL

    await saveDraft('stale-draft', 'baptism_create', { hello: 'old' });
    await saveDraft('fresh-draft', 'baptism_create', { hello: 'fresh' });

    // Make the stale draft appear old to the pruning logic.
    const staleRaw = window.localStorage.getItem('church_registry_offline_draft:stale-draft');
    if (!staleRaw) throw new Error('Missing stale draft storage');
    const staleParsed = JSON.parse(staleRaw) as { updatedAt: number };
    window.localStorage.setItem('church_registry_offline_draft:stale-draft', JSON.stringify({ ...staleParsed, updatedAt: old }));

    const stale = await loadDraft<{ hello: string }>('stale-draft');
    expect(stale).not.toBeNull();
    expect(stale!.updatedAt).toBeLessThan(now);

    await pruneOfflineResources({ force: true });

    expect(await loadDraft<{ hello: string }>('stale-draft')).toBeNull();
    expect(await loadDraft<{ hello: string }>('fresh-draft')).not.toBeNull();
  });
});

