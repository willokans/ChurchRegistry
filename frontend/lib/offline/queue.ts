export type OfflineQueueItemStatus = 'queued' | 'syncing' | 'synced' | 'failed';

export type OfflineSubmissionKind =
  | 'baptism_create'
  | 'communion_create'
  | 'confirmation_create'
  | 'marriage_create'
  | 'holy_order_create';

export type OfflineQueueItemReplayState = {
  /**
   * Idempotency / progress markers for replay within one queue item.
   * Keys represent completed steps; values are completion timestamps.
   */
  steps?: Record<string, number>;

  // Commonly needed created IDs/paths across replay kinds/branches.
  createdBaptismId?: number;
  baptismCertificatePath?: string;
  createdCommunionId?: number;
  createdConfirmationId?: number;
  createdMarriageId?: number;
  createdHolyOrderId?: number;

  /**
   * If we hit an auth expiry (401) mid-replay, we keep the queue item locally but
   * stop replay attempts until the user signs in again.
   */
  authRequiredAt?: number;

  /**
   * Record-level conflict marker for deterministic replay.
   * The UI will prompt and then set `resolvedChoice` to resume.
   */
  conflict?: {
    stepKey: string; // which replay "step" this conflict applies to
    kind:
      | 'communion_already_exists_for_baptism'
      | 'confirmation_already_exists_for_communion'
      | 'marriage_already_exists_for_confirmation'
      | 'marriage_already_exists_for_baptism'
      | 'holy_order_already_exists_for_confirmation';
    message: string;
    detectedAt: number;
    resolvedChoice?: 'server' | 'local';
  };
};

export type OfflineQueueFileRef = {
  fileRefId: string;
  name?: string;
  mimeType?: string;
  size?: number;
};

export type OfflineSubmissionSpec = {
  kind: OfflineSubmissionKind;
  payload: unknown;
};

export type OfflineQueueItem = {
  id: string; // clientSubmissionId
  createdAt: number;
  updatedAt: number;
  status: OfflineQueueItemStatus;
  retryCount: number;
  lastError?: string;
  submission: OfflineSubmissionSpec;
  replayState?: OfflineQueueItemReplayState;

  /**
   * Optional draft pointer so background sync can clear drafts even when the user
   * leaves the create page before the queue item is observed as "synced".
   */
  draftId?: string;
};

const DB_NAME = 'church_registry_offline';
const DB_VERSION = 1;
const QUEUE_STORE = 'queue';

const LS_QUEUE_ITEM_PREFIX = 'church_registry_offline_queue_item:';

function hasIndexedDb(): boolean {
  return typeof indexedDB !== 'undefined';
}

function makeClientSubmissionId(): string {
  if (typeof crypto !== 'undefined') {
    const anyCrypto = crypto as unknown as { randomUUID?: () => string };
    if (typeof anyCrypto.randomUUID === 'function') return anyCrypto.randomUUID();
  }
  return `queue_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function localKey(itemId: string) {
  return `${LS_QUEUE_ITEM_PREFIX}${itemId}`;
}

async function openDb(): Promise<IDBDatabase> {
  return await new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onupgradeneeded = () => {
      const db = req.result;
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

async function idbPut<T>(storeName: string, value: T): Promise<void> {
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

async function idbGetAll<T>(storeName: string): Promise<T[]> {
  const db = await openDb();
  return await new Promise<T[]>((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.openCursor();
    const items: T[] = [];

    req.onerror = () => reject(req.error);
    req.onsuccess = () => {
      const cursor = req.result;
      if (!cursor) return resolve(items);
      items.push(cursor.value as T);
      cursor.continue();
    };
  });
}

function getAllLocalQueueItems(): OfflineQueueItem[] {
  if (typeof localStorage === 'undefined') return [];
  const items: OfflineQueueItem[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith(LS_QUEUE_ITEM_PREFIX)) continue;
    const raw = localStorage.getItem(key);
    if (!raw) continue;
    try {
      items.push(JSON.parse(raw) as OfflineQueueItem);
    } catch {
      // ignore malformed
    }
  }
  return items;
}

function storeLocalQueueItem(item: OfflineQueueItem) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(localKey(item.id), JSON.stringify(item));
}

function deleteLocalQueueItem(itemId: string) {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(localKey(itemId));
}

function loadLocalQueueItem(itemId: string): OfflineQueueItem | null {
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(localKey(itemId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as OfflineQueueItem;
  } catch {
    return null;
  }
}

// Lightweight in-memory eventing for same-tab UI updates.
// Uses DOM EventTarget so it works in the browser and Jest jsdom.
const queueEventTarget = new EventTarget();

type QueueItemUpdatedDetail = {
  itemId: string;
  item: OfflineQueueItem;
};

function dispatchQueueItemUpdated(item: OfflineQueueItem) {
  queueEventTarget.dispatchEvent(
    new CustomEvent<QueueItemUpdatedDetail>('queueItemUpdated', {
      detail: { itemId: item.id, item },
    })
  );
}

export async function enqueueOfflineSubmission(
  spec: OfflineSubmissionSpec,
  opts?: {
    draftId?: string;
  }
): Promise<string> {
  const now = Date.now();
  const id = makeClientSubmissionId();

  const item: OfflineQueueItem = {
    id,
    createdAt: now,
    updatedAt: now,
    status: 'queued',
    retryCount: 0,
    submission: spec,
    draftId: opts?.draftId,
  };

  if (!hasIndexedDb()) {
    storeLocalQueueItem(item);
    dispatchQueueItemUpdated(item);
    return id;
  }

  await idbPut<OfflineQueueItem>(QUEUE_STORE, item);
  dispatchQueueItemUpdated(item);
  return id;
}

export async function getOfflineQueueItem(itemId: string): Promise<OfflineQueueItem | null> {
  if (!hasIndexedDb()) {
    return loadLocalQueueItem(itemId);
  }
  return await idbGet<OfflineQueueItem>(QUEUE_STORE, itemId);
}

export async function listOfflineQueueItems(options?: {
  status?: OfflineQueueItemStatus;
}): Promise<OfflineQueueItem[]> {
  if (!hasIndexedDb()) {
    const items = getAllLocalQueueItems();
    if (options?.status) return items.filter((i) => i.status === options.status);
    return items;
  }

  const all = await idbGetAll<OfflineQueueItem>(QUEUE_STORE);
  if (options?.status) return all.filter((i) => i.status === options.status);
  return all;
}

export async function updateOfflineQueueItemStatus(
  itemId: string,
  nextStatus: OfflineQueueItemStatus,
  opts?: { lastError?: string; incrementRetry?: boolean; replayState?: OfflineQueueItemReplayState }
): Promise<OfflineQueueItem | null> {
  const current = await getOfflineQueueItem(itemId);
  if (!current) return null;

  const updated: OfflineQueueItem = {
    ...current,
    status: nextStatus,
    lastError: opts?.lastError,
    retryCount: opts?.incrementRetry ? current.retryCount + 1 : current.retryCount,
    replayState: opts?.replayState ?? current.replayState,
    updatedAt: Date.now(),
  };

  if (!hasIndexedDb()) {
    storeLocalQueueItem(updated);
    dispatchQueueItemUpdated(updated);
    return updated;
  }

  await idbPut<OfflineQueueItem>(QUEUE_STORE, updated);
  dispatchQueueItemUpdated(updated);
  return updated;
}

export async function deleteOfflineQueueItem(itemId: string): Promise<void> {
  if (!hasIndexedDb()) {
    deleteLocalQueueItem(itemId);
    return;
  }
  await idbDelete(QUEUE_STORE, itemId);
}

export function subscribeToOfflineQueueItem(itemId: string, cb: (item: OfflineQueueItem) => void): () => void {
  function handler(e: Event) {
    const event = e as CustomEvent<QueueItemUpdatedDetail>;
    if (!event?.detail) return;
    if (event.detail.itemId !== itemId) return;
    cb(event.detail.item);
  }

  queueEventTarget.addEventListener('queueItemUpdated', handler as EventListener);
  return () => queueEventTarget.removeEventListener('queueItemUpdated', handler as EventListener);
}

export function subscribeToOfflineQueueItemUpdates(cb: (item: OfflineQueueItem) => void): () => void {
  function handler(e: Event) {
    const event = e as CustomEvent<QueueItemUpdatedDetail>;
    if (!event?.detail?.item) return;
    cb(event.detail.item);
  }

  queueEventTarget.addEventListener('queueItemUpdated', handler as EventListener);
  return () => queueEventTarget.removeEventListener('queueItemUpdated', handler as EventListener);
}

