import { openOfflineDb } from '@/lib/offline/openOfflineDb';

export type OfflineDraftRecord<TPayload> = {
  /**
   * Stable key for draft payload references.
   * Kept as `id` as a legacy field for existing localStorage tests/fixtures.
   */
  draftId: string;
  id: string;
  formType: string;
  updatedAt: number;
  payload: TPayload;
};

const DRAFTS_STORE = 'drafts';

const POINTER_PREFIX = 'church_registry_offline_draft_ptr:';

function hasIndexedDb(): boolean {
  return typeof indexedDB !== 'undefined';
}

function localKey(draftId: string) {
  return `church_registry_offline_draft:${draftId}`;
}

function pointerKey(draftId: string) {
  return `${POINTER_PREFIX}${draftId}`;
}

async function idbGet<T>(storeName: string, id: string): Promise<T | null> {
  const db = await openOfflineDb();
  return await new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.get(id);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve((req.result as T | undefined) ?? null);
  });
}

async function idbPut<T extends { id: string }>(storeName: string, value: T): Promise<void> {
  const db = await openOfflineDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.put(value);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve();
  });
}

async function idbDelete(storeName: string, id: string): Promise<void> {
  const db = await openOfflineDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.delete(id);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve();
  });
}

/**
 * Draft persistence:
 * - Prefer IndexedDB in the browser for reliability.
 * - Fall back to localStorage when IndexedDB is unavailable (e.g. some test runners).
 */
export async function saveDraft<TPayload>(
  id: string,
  formType: string,
  payload: TPayload
): Promise<void> {
  const updatedAt = Date.now();
  const record: OfflineDraftRecord<TPayload> = { draftId: id, id, formType, updatedAt, payload };
  if (!hasIndexedDb()) {
    localStorage.setItem(localKey(id), JSON.stringify(record));
    localStorage.setItem(pointerKey(id), JSON.stringify({ draftId: id, formType, updatedAt }));
    return;
  }
  // Round-trip through JSON so IndexedDB structured clone only sees plain data (avoids DataCloneError).
  let storable: OfflineDraftRecord<TPayload>;
  try {
    storable = JSON.parse(JSON.stringify(record)) as OfflineDraftRecord<TPayload>;
  } catch {
    throw new Error('Draft payload could not be serialized for local storage.');
  }
  await idbPut(DRAFTS_STORE, storable);
  if (hasLocalStorage()) localStorage.setItem(pointerKey(id), JSON.stringify({ draftId: id, formType, updatedAt }));
}

export async function loadDraft<TPayload>(id: string): Promise<OfflineDraftRecord<TPayload> | null> {
  if (!hasIndexedDb()) {
    const raw = localStorage.getItem(localKey(id));
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as Partial<OfflineDraftRecord<TPayload>> & { id?: string };
      const draftId = parsed.draftId ?? parsed.id ?? id;
      return { ...(parsed as OfflineDraftRecord<TPayload>), draftId, id: parsed.id ?? draftId };
    } catch {
      return null;
    }
  }

  const loaded = await idbGet<OfflineDraftRecord<TPayload> | Partial<OfflineDraftRecord<TPayload>>>(DRAFTS_STORE, id);
  if (!loaded) return null;

  const anyLoaded = loaded as Partial<OfflineDraftRecord<TPayload>> & { id?: string };
  const draftId = anyLoaded.draftId ?? anyLoaded.id ?? id;
  return { ...(anyLoaded as OfflineDraftRecord<TPayload>), draftId, id: anyLoaded.id ?? draftId };
}

export async function deleteDraft(id: string): Promise<void> {
  if (!hasIndexedDb()) {
    localStorage.removeItem(localKey(id));
    localStorage.removeItem(pointerKey(id));
    return;
  }
  await idbDelete(DRAFTS_STORE, id);
  if (hasLocalStorage()) localStorage.removeItem(pointerKey(id));
}

export async function loadDraftMeta(draftId: string): Promise<{ draftId: string; formType: string; updatedAt: number } | null> {
  if (!hasLocalStorage()) return null;
  const raw = localStorage.getItem(pointerKey(draftId));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { draftId: string; formType: string; updatedAt: number };
    if (!parsed?.draftId || !parsed?.formType || typeof parsed.updatedAt !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

function hasLocalStorage(): boolean {
  return typeof localStorage !== 'undefined';
}

export async function listDrafts(): Promise<OfflineDraftRecord<any>[]> {
  const prefix = 'church_registry_offline_draft:';

  if (!hasIndexedDb()) {
    if (!hasLocalStorage()) return [];

    const results: OfflineDraftRecord<any>[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(prefix)) continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;

      try {
        const parsed = JSON.parse(raw) as Partial<OfflineDraftRecord<any>> & {
          draftId?: string;
          id?: string;
          formType?: string;
          updatedAt?: number;
          payload?: unknown;
        };

        if (!parsed?.draftId || !parsed?.id || typeof parsed?.formType !== 'string' || typeof parsed?.updatedAt !== 'number') continue;
        results.push({
          draftId: parsed.draftId,
          id: parsed.id,
          formType: parsed.formType,
          updatedAt: parsed.updatedAt,
          payload: parsed.payload,
        });
      } catch {
        // Ignore malformed entries.
      }
    }

    return results;
  }

  const db = await openOfflineDb();
  return await new Promise<OfflineDraftRecord<any>[]>((resolve, reject) => {
    const tx = db.transaction(DRAFTS_STORE, 'readonly');
    const store = tx.objectStore(DRAFTS_STORE);
    const req = store.openCursor();

    const results: OfflineDraftRecord<any>[] = [];
    req.onerror = () => reject(req.error);
    req.onsuccess = () => {
      const cursor = req.result;
      if (!cursor) return resolve(results);

      results.push(cursor.value as OfflineDraftRecord<any>);
      cursor.continue();
    };
  });
}

