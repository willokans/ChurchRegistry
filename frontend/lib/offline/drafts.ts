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

const DB_NAME = 'church_registry_offline';
const DB_VERSION = 1;

const DRAFTS_STORE = 'drafts';
const FILES_STORE = 'files';
const QUEUE_STORE = 'queue';

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

async function openDb(): Promise<IDBDatabase> {
  return await new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(DRAFTS_STORE)) db.createObjectStore(DRAFTS_STORE, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(FILES_STORE)) db.createObjectStore(FILES_STORE, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(QUEUE_STORE)) db.createObjectStore(QUEUE_STORE, { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
  });
}

async function idbGet<T>(storeName: string, id: string): Promise<T | null> {
  const db = await openDb();
  return await new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.get(id);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve((req.result as T | undefined) ?? null);
  });
}

async function idbPut<T extends { id: string }>(storeName: string, value: T): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.put(value);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve();
  });
}

async function idbDelete(storeName: string, id: string): Promise<void> {
  const db = await openDb();
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
  await idbPut(DRAFTS_STORE, record);
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

