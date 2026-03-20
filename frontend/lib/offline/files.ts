export type OfflineFileMeta = {
  fileRefId: string;
  mimeType: string;
  size: number;
};

type OfflineFileRecord = {
  id: string; // fileRefId
  /**
   * When offline-attachment guardrails decide to defer a file (e.g., exceeds total storage cap),
   * we persist metadata-only and omit the blob.
   */
  blob?: Blob;
  mimeType: string;
  size: number;
  updatedAt: number;
};

const DB_NAME = 'church_registry_offline';
const DB_VERSION = 1;

const DRAFTS_STORE = 'drafts';
const FILES_STORE = 'files';
const QUEUE_STORE = 'queue';

export const DEFAULT_MAX_OFFLINE_FILE_BYTES = 2 * 1024 * 1024; // 2 MB
export const DEFAULT_MAX_OFFLINE_TOTAL_BYTES = 25 * 1024 * 1024; // ~25 MB per device

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

  // Node.js environments may provide `Buffer`; in browsers it will be undefined.
  type NodeBuffer = { toString: (encoding: 'base64') => string };
  type BufferCtor = { from: (data: Uint8Array) => NodeBuffer };
  const BufferCtor = (globalThis as unknown as { Buffer?: BufferCtor }).Buffer;
  if (BufferCtor) return BufferCtor.from(bytes).toString('base64');

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
  // Node.js environments may provide `Buffer`; in browsers it will be undefined.
  type NodeBuffer = { buffer: ArrayBuffer; byteOffset: number; byteLength: number };
  type BufferCtor = { from: (data: string, encoding: 'base64') => NodeBuffer };
  const BufferCtor = (globalThis as unknown as { Buffer?: BufferCtor }).Buffer;
  if (BufferCtor) {
    const nodeBuffer = BufferCtor.from(base64, 'base64');
    const sliced = nodeBuffer.buffer.slice(nodeBuffer.byteOffset, nodeBuffer.byteOffset + nodeBuffer.byteLength);
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

export type PersistOfflineAttachmentGuardrailsOptions = {
  /**
   * Stable key for draft payload references.
   * If omitted, an id is generated for this attach attempt.
   */
  fileRefId?: string;
  maxBytesPerFile?: number;
  maxTotalBytes?: number;
  allowedMimeType?: (mimeType: string | undefined) => boolean;
};

export type PersistOfflineAttachmentGuardrailsResult = OfflineFileMeta & {
  storedBlob: boolean;
  deferredReason?: string;
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
        storedBlob: true,
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

async function persistOfflineFileMetaOnly(meta: OfflineFileMeta, fileRefId: string) {
  if (!hasIndexedDb()) {
    if (!hasLocalStorage()) throw new Error('No offline storage available in this environment.');

    localStorage.setItem(
      localKey(fileRefId),
      JSON.stringify({
        fileRefId,
        mimeType: meta.mimeType,
        size: meta.size,
        storedBlob: false,
        updatedAt: Date.now(),
      })
    );
    return;
  }

  await idbPut<OfflineFileRecord>(FILES_STORE, {
    id: fileRefId,
    mimeType: meta.mimeType,
    size: meta.size,
    updatedAt: Date.now(),
  });
}

async function getOfflineStoredBlobBytes(): Promise<number> {
  if (!hasIndexedDb()) {
    if (!hasLocalStorage()) return 0;
    const prefix = 'church_registry_offline_file:';
    let total = 0;
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (!key || !key.startsWith(prefix)) continue;
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw) as { size?: number; storedBlob?: boolean; base64?: unknown };
        if (parsed && typeof parsed?.size === 'number') {
          const hasBlob = parsed?.storedBlob === true || typeof parsed?.base64 === 'string';
          if (hasBlob) total += parsed.size;
        }
      } catch {
        // Ignore malformed entries.
      }
    }
    return total;
  }

  const db = await openDb();
  return await new Promise<number>((resolve, reject) => {
    const tx = db.transaction(FILES_STORE, 'readonly');
    const store = tx.objectStore(FILES_STORE);
    const req = store.openCursor();
    let total = 0;

    req.onerror = () => reject(req.error);
    req.onsuccess = () => {
      const cursor = req.result;
      if (!cursor) return resolve(total);
      const value = cursor.value as OfflineFileRecord;
      if (value?.blob) total += value.size;
      cursor.continue();
    };
  });
}

/**
 * Persist an attachment subject to offline guardrails.
 * - If the file fits (type + size + device total cap), the blob is stored.
 * - Otherwise, we defer by persisting metadata only (no blob) and return `storedBlob=false`.
 */
export async function persistOfflineAttachmentWithGuardrails(
  file: Blob,
  opts?: PersistOfflineAttachmentGuardrailsOptions
): Promise<PersistOfflineAttachmentGuardrailsResult> {
  const mimeType = file.type ?? '';
  const size = file.size;
  const allowedMimeType = opts?.allowedMimeType ?? isAllowedOfflineMimeType;

  const maxBytesPerFile = opts?.maxBytesPerFile ?? DEFAULT_MAX_OFFLINE_FILE_BYTES;
  const maxTotalBytes = opts?.maxTotalBytes ?? DEFAULT_MAX_OFFLINE_TOTAL_BYTES;
  const fileRefId = opts?.fileRefId ?? makeOfflineFileRefId();

  if (!allowedMimeType(mimeType)) {
    const meta: OfflineFileMeta = { fileRefId, mimeType, size };
    await persistOfflineFileMetaOnly(meta, fileRefId);
    return {
      ...meta,
      storedBlob: false,
      deferredReason: 'Unsupported file type. Please upload a PDF or an image.',
    };
  }

  if (size > maxBytesPerFile) {
    const meta: OfflineFileMeta = { fileRefId, mimeType, size };
    await persistOfflineFileMetaOnly(meta, fileRefId);
    return {
      ...meta,
      storedBlob: false,
      deferredReason: `File too large for offline storage (max ${Math.round(maxBytesPerFile / (1024 * 1024))}MB).`,
    };
  }

  const usedBytes = await getOfflineStoredBlobBytes();
  if (usedBytes + size > maxTotalBytes) {
    const meta: OfflineFileMeta = { fileRefId, mimeType, size };
    await persistOfflineFileMetaOnly(meta, fileRefId);
    return {
      ...meta,
      storedBlob: false,
      deferredReason: 'Offline attachment storage is full. This file will upload when you are back online.',
    };
  }

  // Happy path: store blob.
  const stored = await persistOfflineBlob(file, {
    fileRefId,
    maxBytes: maxBytesPerFile,
    allowedMimeType,
  });
  return { ...stored, storedBlob: true };
}

export async function loadOfflineBlob(fileRefId: string): Promise<Blob | null> {
  if (!fileRefId) return null;

  if (!hasIndexedDb()) {
    if (!hasLocalStorage()) return null;
    const raw = localStorage.getItem(localKey(fileRefId));
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw) as { mimeType?: string; base64?: string };
      if (!parsed?.mimeType || !parsed?.base64) return null;
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

export type OfflineFileListing = {
  fileRefId: string;
  mimeType: string;
  size: number;
  storedBlob: boolean;
  updatedAt: number;
};

export async function listOfflineFiles(): Promise<OfflineFileListing[]> {
  const prefix = 'church_registry_offline_file:';

  if (!hasIndexedDb()) {
    if (!hasLocalStorage()) return [];

    const results: OfflineFileListing[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(prefix)) continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;

      try {
        const parsed = JSON.parse(raw) as {
          fileRefId?: string;
          mimeType?: string;
          size?: number;
          storedBlob?: boolean;
          updatedAt?: number;
        };

        if (!parsed?.fileRefId || typeof parsed?.mimeType !== 'string' || typeof parsed?.size !== 'number') continue;
        results.push({
          fileRefId: parsed.fileRefId,
          mimeType: parsed.mimeType,
          size: parsed.size,
          storedBlob: parsed.storedBlob === true || typeof (parsed as any)?.base64 === 'string',
          updatedAt: typeof parsed?.updatedAt === 'number' ? parsed.updatedAt : 0,
        });
      } catch {
        // Ignore malformed storage entries.
      }
    }

    return results;
  }

  const db = await openDb();
  return await new Promise<OfflineFileListing[]>((resolve, reject) => {
    const tx = db.transaction(FILES_STORE, 'readonly');
    const store = tx.objectStore(FILES_STORE);
    const req = store.openCursor();

    const results: OfflineFileListing[] = [];
    req.onerror = () => reject(req.error);
    req.onsuccess = () => {
      const cursor = req.result;
      if (!cursor) return resolve(results);

      const record = cursor.value as OfflineFileRecord;
      results.push({
        fileRefId: record.id,
        mimeType: record.mimeType,
        size: record.size,
        storedBlob: record.blob !== undefined,
        updatedAt: record.updatedAt,
      });

      cursor.continue();
    };
  });
}

