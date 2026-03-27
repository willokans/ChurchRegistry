/**
 * Single IndexedDB used by drafts, offline file blobs, and the submission queue.
 * All modules must use this opener so `onupgradeneeded` creates every object store;
 * otherwise the first module to open the DB could omit stores others rely on.
 */
const DB_NAME = 'church_registry_offline';

/** Increment when adding stores or changing schema; upgrade creates any missing stores. */
export const OFFLINE_DB_VERSION = 3;

const DRAFTS_STORE = 'drafts';
const FILES_STORE = 'files';
const QUEUE_STORE = 'queue';

export async function openOfflineDb(): Promise<IDBDatabase> {
  return await new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, OFFLINE_DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onupgradeneeded = () => {
      const db = req.result;
      // Create any store that is missing (handles partial DBs from older builds or interrupted upgrades).
      if (!db.objectStoreNames.contains(DRAFTS_STORE)) {
        db.createObjectStore(DRAFTS_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(FILES_STORE)) {
        db.createObjectStore(FILES_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(QUEUE_STORE)) {
        db.createObjectStore(QUEUE_STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
  });
}
