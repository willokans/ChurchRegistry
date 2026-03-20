export type OfflineDraftRecord<TPayload> = {
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

function hasIndexedDb(): boolean {
  return typeof indexedDB !== 'undefined';
}

function localKey(id: string) {
  return `church_registry_offline_draft:${id}`;
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
  const record: OfflineDraftRecord<TPayload> = { id, formType, updatedAt: Date.now(), payload };
  if (!hasIndexedDb()) {
    localStorage.setItem(localKey(id), JSON.stringify(record));
    return;
  }
  await idbPut(DRAFTS_STORE, record);
}

export async function loadDraft<TPayload>(id: string): Promise<OfflineDraftRecord<TPayload> | null> {
  if (!hasIndexedDb()) {
    const raw = localStorage.getItem(localKey(id));
    if (!raw) return null;
    try {
      return JSON.parse(raw) as OfflineDraftRecord<TPayload>;
    } catch {
      return null;
    }
  }
  return await idbGet<OfflineDraftRecord<TPayload>>(DRAFTS_STORE, id);
}

export async function deleteDraft(id: string): Promise<void> {
  if (!hasIndexedDb()) {
    localStorage.removeItem(localKey(id));
    return;
  }
  await idbDelete(DRAFTS_STORE, id);
}

