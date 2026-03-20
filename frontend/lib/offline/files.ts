export type OfflineFileMeta = {
  fileRefId: string;
  mimeType: string;
  size: number;
};

type OfflineFileRecord = {
  id: string; // fileRefId
  blob: Blob;
  mimeType: string;
  size: number;
  updatedAt: number;
};

const DB_NAME = 'church_registry_offline';
const DB_VERSION = 1;

const DRAFTS_STORE = 'drafts';
const FILES_STORE = 'files';
const QUEUE_STORE = 'queue';

const DEFAULT_MAX_OFFLINE_FILE_BYTES = 2 * 1024 * 1024; // 2 MB

function hasIndexedDb(): boolean {
  return typeof indexedDB !== 'undefined';
}

function hasLocalStorage(): boolean {
  return typeof localStorage !== 'undefined';
}

function localKey(fileRefId: string) {
  return `church_registry_offline_file:${fileRefId}`;
}

function isAllowedOfflineMimeType(mimeType: string | undefined): boolean {
  if (!mimeType) return false;
  if (mimeType === 'application/pdf') return true;
  if (mimeType.startsWith('image/')) return true;
  return false;
}

function makeOfflineFileRefId(): string {
  if (typeof crypto !== 'undefined') {
    const anyCrypto = crypto as unknown as { randomUUID?: () => string };
    if (typeof anyCrypto.randomUUID === 'function') return anyCrypto.randomUUID();

    // Fallback for environments without `randomUUID`.
    if (typeof (crypto as unknown as { getRandomValues?: (arr: Uint8Array) => Uint8Array }).getRandomValues === 'function') {
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      return Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    }
  }

  return `file_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const BufferCtor = (globalThis as any).Buffer as undefined | { from: (...args: any[]) => any };
  if (BufferCtor) {
    return BufferCtor.from(bytes).toString('base64');
  }

  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    // Avoid spreading `chunk` to keep TS happy with older compilation targets.
    for (let j = 0; j < chunk.length; j++) binary += String.fromCharCode(chunk[j]);
  }
  // eslint-disable-next-line no-undef
  return btoa(binary);
}

function base64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const BufferCtor = (globalThis as any).Buffer as undefined | { from: (...args: any[]) => any };
  if (BufferCtor) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nodeBuffer = BufferCtor.from(base64, 'base64') as any;
    const sliced = nodeBuffer.buffer.slice(
      nodeBuffer.byteOffset,
      nodeBuffer.byteOffset + nodeBuffer.byteLength
    ) as ArrayBuffer;
    return new Uint8Array(sliced);
  }

  // eslint-disable-next-line no-undef
  const binary = atob(base64);
  const bytes: Uint8Array<ArrayBuffer> = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function blobToBase64(blob: Blob): Promise<string> {
  if (typeof (blob as unknown as { arrayBuffer?: () => Promise<ArrayBuffer> }).arrayBuffer === 'function') {
    const buffer = await blob.arrayBuffer();
    return arrayBufferToBase64(buffer);
  }

  // jsdom/Jest can provide a Blob without `arrayBuffer()`; use FileReader if available.
  if (typeof FileReader !== 'undefined') {
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error);
      reader.onload = () => {
        // FileReader returns either ArrayBuffer or a binary string depending on read method.
        const result = reader.result;
        if (result instanceof ArrayBuffer) return resolve(arrayBufferToBase64(result));
        if (typeof result === 'string') {
          // Best-effort fallback: treat as binary string.
          const bytes = new Uint8Array(result.length);
          for (let i = 0; i < result.length; i++) bytes[i] = result.charCodeAt(i);
          return resolve(arrayBufferToBase64(bytes.buffer));
        }
        reject(new Error('Failed to read Blob as ArrayBuffer'));
      };
      reader.readAsArrayBuffer(blob);
    });
  }

  // Final fallback: this can be lossy for binary data, but keeps tests/older environments working.
  const text = await blob.text();
  const bytes = new TextEncoder().encode(text);
  return arrayBufferToBase64(bytes.buffer);
}

async function base64ToBlob(base64: string, mimeType: string): Promise<Blob> {
  const bytes = base64ToUint8Array(base64);
  return new Blob([bytes], { type: mimeType });
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

export type PersistOfflineBlobOptions = {
  fileRefId?: string;
  maxBytes?: number;
  allowedMimeType?: (mimeType: string | undefined) => boolean;
};

/**
 * Persist a supporting/attachment blob offline.
 * - Stores the Blob in IndexedDB when available.
 * - Falls back to localStorage (base64) for non-IndexedDB environments (e.g. deterministic tests).
 */
export async function persistOfflineBlob(
  file: Blob,
  opts?: PersistOfflineBlobOptions
): Promise<OfflineFileMeta> {
  const mimeType = file.type ?? '';
  const size = file.size;

  const maxBytes = opts?.maxBytes ?? DEFAULT_MAX_OFFLINE_FILE_BYTES;
  if (size > maxBytes) {
    throw new Error(`Offline attachment is too large (max ${maxBytes} bytes).`);
  }

  const allowedMimeType = opts?.allowedMimeType ?? isAllowedOfflineMimeType;
  if (!allowedMimeType(mimeType)) {
    throw new Error('Unsupported offline attachment type.');
  }

  const fileRefId = opts?.fileRefId ?? makeOfflineFileRefId();

  if (!hasIndexedDb()) {
    if (!hasLocalStorage()) throw new Error('No offline storage available in this environment.');

    const base64 = await blobToBase64(file);
    localStorage.setItem(
      localKey(fileRefId),
      JSON.stringify({
        fileRefId,
        mimeType,
        size,
        base64,
        updatedAt: Date.now(),
      })
    );

    return { fileRefId, mimeType, size };
  }

  await idbPut<OfflineFileRecord>(FILES_STORE, {
    id: fileRefId,
    blob: file,
    mimeType,
    size,
    updatedAt: Date.now(),
  });

  return { fileRefId, mimeType, size };
}

export async function loadOfflineBlob(fileRefId: string): Promise<Blob | null> {
  if (!fileRefId) return null;

  if (!hasIndexedDb()) {
    if (!hasLocalStorage()) return null;
    const raw = localStorage.getItem(localKey(fileRefId));
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw) as { mimeType: string; base64: string };
      if (!parsed?.base64 || !parsed?.mimeType) return null;
      return await base64ToBlob(parsed.base64, parsed.mimeType);
    } catch {
      return null;
    }
  }

  const record = await idbGet<OfflineFileRecord>(FILES_STORE, fileRefId);
  return record?.blob ?? null;
}

export async function loadOfflineFileMeta(fileRefId: string): Promise<OfflineFileMeta | null> {
  if (!fileRefId) return null;

  if (!hasIndexedDb()) {
    if (!hasLocalStorage()) return null;
    const raw = localStorage.getItem(localKey(fileRefId));
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw) as { fileRefId: string; mimeType: string; size: number };
      if (!parsed?.mimeType || typeof parsed?.size !== 'number') return null;
      return { fileRefId, mimeType: parsed.mimeType, size: parsed.size };
    } catch {
      return null;
    }
  }

  const record = await idbGet<OfflineFileRecord>(FILES_STORE, fileRefId);
  return record
    ? {
        fileRefId: record.id,
        mimeType: record.mimeType,
        size: record.size,
      }
    : null;
}

export async function deleteOfflineBlob(fileRefId: string): Promise<void> {
  if (!fileRefId) return;

  if (!hasIndexedDb()) {
    if (!hasLocalStorage()) return;
    localStorage.removeItem(localKey(fileRefId));
    return;
  }

  await idbDelete(FILES_STORE, fileRefId);
}

