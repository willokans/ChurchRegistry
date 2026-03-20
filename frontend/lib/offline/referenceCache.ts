/**
 * Minimal offline cache for reference lists needed by create flows.
 *
 * Design goals:
 * - Cache only small display-relevant subsets (ids + display fields).
 * - TTL + hard caps to avoid unbounded local growth.
 * - No blanket /api/* caching; only specific reference endpoints call these helpers.
 */

type UserNamespace = string;

const CACHE_VERSION = 1;
const CACHE_PREFIX = `church_registry_offline_reference_cache:v${CACHE_VERSION}`;

// 7 days keeps offline data reasonably fresh while still supporting day-to-day workflows.
const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// Create flows only request the first page (defaults: page=0, size=50).
const MAX_ITEMS_PER_LIST_ENTRY = 50;

// Hard caps: keep localStorage bounded.
const MAX_LIST_CACHE_ENTRIES = 30;
const MAX_DIOCESE_CACHE_ENTRIES = 10;

// Active-diocese reference list size: usually small.
const MAX_PARISHES_PER_DIOCESE = 250;

type CachedListType = 'baptisms' | 'communions' | 'confirmations';

type CachedBaptismItem = {
  id: number;
  baptismName: string;
  otherNames: string;
  surname: string;
  dateOfBirth: string;
  fathersName: string;
  mothersName: string;
  // Some UI paths (filters/list pages) might touch these; keep them empty-safe.
  gender?: string;
};

type CachedCommunionItem = {
  id: number;
  baptismId: number;
  baptismName: string;
  otherNames: string;
  surname: string;
  communionDate: string;
  officiatingPriest: string;
  parish?: string;
};

type CachedConfirmationItem = {
  id: number;
  baptismName: string;
  otherNames: string;
  surname: string;
  confirmationDate: string;
  officiatingBishop?: string;
};

type CachedListEntry = {
  expiresAt: number;
  updatedAt: number;
  items: Array<CachedBaptismItem | CachedCommunionItem | CachedConfirmationItem>;
};

type CachedParishRef = {
  id: number;
  parishName: string;
  dioceseId: number;
};

type CachedDioceseEntry = {
  expiresAt: number;
  updatedAt: number;
  dioceseId: number;
  dioceseName: string;
  parishes: CachedParishRef[];
};

function hasLocalStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function getUserNamespace(): UserNamespace {
  if (!hasLocalStorage()) return 'anonymous';

  // `church_registry_user` is stored by `getStoredUser()` in `frontend/lib/api.ts`.
  // We re-read it here to keep this module decoupled from `api.ts` (avoid cycles).
  const raw = window.localStorage.getItem('church_registry_user');
  if (!raw) return 'anonymous';
  try {
    const parsed = JSON.parse(raw) as { username?: string } | null;
    const username = parsed?.username;
    return username && username.trim().length > 0 ? username.trim() : 'anonymous';
  } catch {
    return 'anonymous';
  }
}

function isExpired(expiresAt: number): boolean {
  return typeof expiresAt === 'number' && Date.now() > expiresAt;
}

function getListKey(ns: UserNamespace, listType: CachedListType, parishId: number, page: number): string {
  return `${CACHE_PREFIX}:ns:${ns}:list:${listType}:${parishId}:p${page}`;
}

function getDioceseKey(ns: UserNamespace, dioceseId: number): string {
  return `${CACHE_PREFIX}:ns:${ns}:diocese:${dioceseId}`;
}

function safeParseJson<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function readAndValidateEntry<T extends { expiresAt: number }>(raw: string | null): T | null {
  const parsed = safeParseJson<T>(raw);
  if (!parsed) return null;
  if (isExpired(parsed.expiresAt)) return null;
  return parsed;
}

function getCacheKeysWithPrefix(prefix: string): string[] {
  if (!hasLocalStorage()) return [];
  const keys: string[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const k = window.localStorage.key(i);
    if (!k) continue;
    if (k.startsWith(prefix)) keys.push(k);
  }
  return keys;
}

function enforceCap(scopePrefix: string, maxEntries: number) {
  if (!hasLocalStorage()) return;

  const keys = getCacheKeysWithPrefix(scopePrefix);
  if (keys.length <= maxEntries) return;

  const entries: Array<{ key: string; updatedAt: number }> = [];
  for (const k of keys) {
    const entry = readAndValidateEntry<CachedListEntry | CachedDioceseEntry>(window.localStorage.getItem(k));
    if (!entry) {
      // Expired/malformed: clear it and continue.
      window.localStorage.removeItem(k);
      continue;
    }
    const updatedAt = typeof (entry as any).updatedAt === 'number' ? (entry as any).updatedAt : 0;
    entries.push({ key: k, updatedAt });
  }

  entries.sort((a, b) => a.updatedAt - b.updatedAt); // oldest first
  const toDelete = Math.max(0, entries.length - maxEntries);
  for (let i = 0; i < toDelete; i++) {
    window.localStorage.removeItem(entries[i].key);
  }
}

function cleanupExpiredByPrefix(scopePrefix: string) {
  if (!hasLocalStorage()) return;
  const keys = getCacheKeysWithPrefix(scopePrefix);
  for (const k of keys) {
    const parsed = safeParseJson<{ expiresAt?: number }>(window.localStorage.getItem(k));
    if (parsed?.expiresAt != null && isExpired(parsed.expiresAt)) window.localStorage.removeItem(k);
  }
}

function cacheListItems<T extends CachedListType>(
  listType: T,
  parishId: number,
  page: number,
  items: Array<CachedBaptismItem | CachedCommunionItem | CachedConfirmationItem>,
  opts?: { ttlMs?: number }
) {
  if (!hasLocalStorage()) return;
  if (page !== 0) return; // keep cache minimal; reference lists are only needed for first page

  const ns = getUserNamespace();
  const ttlMs = opts?.ttlMs ?? DEFAULT_TTL_MS;
  const expiresAt = Date.now() + ttlMs;

  const entry: CachedListEntry = {
    expiresAt,
    updatedAt: Date.now(),
    items: items.slice(0, MAX_ITEMS_PER_LIST_ENTRY),
  };

  const key = getListKey(ns, listType, parishId, page);
  window.localStorage.setItem(key, JSON.stringify(entry));

  // Cleanup before enforcing caps to avoid deleting freshly stored entries.
  cleanupExpiredByPrefix(`${CACHE_PREFIX}:ns:${ns}:list:${listType}:`);
  enforceCap(`${CACHE_PREFIX}:ns:${ns}:list:${listType}:`, MAX_LIST_CACHE_ENTRIES);
}

function loadListItems<T extends CachedListType>(
  listType: T,
  parishId: number,
  page: number
): CachedListEntry | null {
  if (!hasLocalStorage()) return null;
  if (page !== 0) return null; // reference cache is only stored for page 0

  const ns = getUserNamespace();
  const key = getListKey(ns, listType, parishId, page);
  const entry = readAndValidateEntry<CachedListEntry>(window.localStorage.getItem(key));
  return entry;
}

export function saveCachedBaptisms(parishId: number, page: number, items: CachedBaptismItem[], opts?: { ttlMs?: number }) {
  cacheListItems('baptisms', parishId, page, items, opts);
}

export function saveCachedCommunions(
  parishId: number,
  page: number,
  items: CachedCommunionItem[],
  opts?: { ttlMs?: number }
) {
  cacheListItems('communions', parishId, page, items, opts);
}

export function saveCachedConfirmations(
  parishId: number,
  page: number,
  items: CachedConfirmationItem[],
  opts?: { ttlMs?: number }
) {
  cacheListItems('confirmations', parishId, page, items, opts);
}

export function loadCachedBaptisms(parishId: number, page: number): CachedBaptismItem[] | null {
  const entry = loadListItems('baptisms', parishId, page);
  if (!entry) return null;
  return entry.items as CachedBaptismItem[];
}

export function loadCachedCommunions(parishId: number, page: number): CachedCommunionItem[] | null {
  const entry = loadListItems('communions', parishId, page);
  if (!entry) return null;
  return entry.items as CachedCommunionItem[];
}

export function loadCachedConfirmations(parishId: number, page: number): CachedConfirmationItem[] | null {
  const entry = loadListItems('confirmations', parishId, page);
  if (!entry) return null;
  return entry.items as CachedConfirmationItem[];
}

export function saveCachedDioceseWithParishes(
  dioceseId: number,
  dioceseName: string,
  parishes: CachedParishRef[],
  opts?: { ttlMs?: number }
) {
  if (!hasLocalStorage()) return;
  if (!dioceseId || dioceseId <= 0) return;

  const ns = getUserNamespace();
  const ttlMs = opts?.ttlMs ?? DEFAULT_TTL_MS;
  const expiresAt = Date.now() + ttlMs;

  const entry: CachedDioceseEntry = {
    expiresAt,
    updatedAt: Date.now(),
    dioceseId,
    dioceseName: dioceseName.trim(),
    parishes: parishes
      .filter((p) => p && p.id > 0 && p.parishName.trim().length > 0)
      .slice(0, MAX_PARISHES_PER_DIOCESE)
      .map((p) => ({
        id: p.id,
        parishName: p.parishName.trim(),
        dioceseId: p.dioceseId,
      })),
  };

  const key = getDioceseKey(ns, dioceseId);
  window.localStorage.setItem(key, JSON.stringify(entry));

  cleanupExpiredByPrefix(`${CACHE_PREFIX}:ns:${ns}:diocese:`);
  enforceCap(`${CACHE_PREFIX}:ns:${ns}:diocese:`, MAX_DIOCESE_CACHE_ENTRIES);
}

export function loadCachedDioceseWithParishes(dioceseId: number): CachedDioceseEntry | null {
  if (!hasLocalStorage()) return null;
  if (!dioceseId || dioceseId <= 0) return null;

  const ns = getUserNamespace();
  const key = getDioceseKey(ns, dioceseId);
  return readAndValidateEntry<CachedDioceseEntry>(window.localStorage.getItem(key));
}

export function loadCachedDioceseWithParishesByParishId(parishId: number): CachedDioceseEntry | null {
  if (!hasLocalStorage()) return null;
  if (!parishId || parishId <= 0) return null;

  const ns = getUserNamespace();
  const scopePrefix = `${CACHE_PREFIX}:ns:${ns}:diocese:`;
  const keys = getCacheKeysWithPrefix(scopePrefix);

  for (const k of keys) {
    const entry = readAndValidateEntry<CachedDioceseEntry>(window.localStorage.getItem(k));
    if (!entry) continue;
    const hasParish = entry.parishes.some((p) => p.id === parishId);
    if (hasParish) return entry;
  }

  return null;
}

