/**
 * Frontend runs as a UI-only client: all API traffic must go to Spring Boot.
 * NEXT_PUBLIC_API_URL must be an absolute URL (e.g. http://localhost:8080).
 */
function getBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!raw) {
    throw new Error('Missing NEXT_PUBLIC_API_URL. Configure the Spring Boot API URL for the frontend runtime.');
  }

  try {
    return new URL(raw).toString().replace(/\/$/, '');
  } catch {
    throw new Error('Invalid NEXT_PUBLIC_API_URL. Provide an absolute URL like http://localhost:8080');
  }
}

export async function login(username: string, password: string) {
  const res = await fetchWithRetry(`${getBaseUrl()}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    if (res.status === 401) throw new Error('Invalid credentials');
    const text = await res.text();
    throw new Error(text || 'Login failed');
  }
  return res.json();
}

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('church_registry_token');
}

export function getStoredUser(): { username: string; displayName: string | null; role: string | null } | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('church_registry_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function storeAuth(token: string, refreshToken: string, user: { username: string; displayName: string | null; role: string | null }) {
  localStorage.setItem('church_registry_token', token);
  localStorage.setItem('church_registry_refresh_token', refreshToken);
  localStorage.setItem('church_registry_user', JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem('church_registry_token');
  localStorage.removeItem('church_registry_refresh_token');
  localStorage.removeItem('church_registry_user');
}

const PARISH_STORAGE_KEY = 'church_registry_parish_id';

export function getStoredParishId(): number | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(PARISH_STORAGE_KEY);
  if (!raw) return null;
  const id = parseInt(raw, 10);
  return Number.isNaN(id) ? null : id;
}

export function setStoredParishId(parishId: number | null): void {
  if (typeof window === 'undefined') return;
  if (parishId == null) localStorage.removeItem(PARISH_STORAGE_KEY);
  else localStorage.setItem(PARISH_STORAGE_KEY, String(parishId));
}

function getAuthHeaders(): HeadersInit {
  const token = getStoredToken();
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  return headers;
}

/** Fetch with retry for transient failures on unstable connections (e.g. low-bandwidth). */
async function fetchWithRetry(url: string, init?: RequestInit): Promise<Response> {
  const maxRetries = 2;
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, init);
      if (res.ok) return res;
      if (res.status >= 500 && attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 500));
        continue;
      }
      return res;
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 500));
      } else {
        throw lastError;
      }
    }
  }
  throw lastError ?? new Error('Request failed');
}

/** Parse error response text; prefer 'error' or 'message' from JSON when present. */
function parseErrorResponse(text: string, fallback: string): string {
  try {
    const j = JSON.parse(text) as { error?: string; message?: string };
    return (j.error ?? j.message ?? fallback).trim() || fallback;
  } catch {
    return text.trim() || fallback;
  }
}

export interface BaptismResponse {
  id: number;
  createdAt?: string;
  baptismName: string;
  otherNames: string;
  surname: string;
  gender: string;
  dateOfBirth: string;
  fathersName: string;
  mothersName: string;
  sponsorNames: string;
  officiatingPriest: string;
  parishId: number;
  /** Parish name (for display when baptized in same church). */
  parishName?: string;
  address?: string;
  parishAddress?: string;
  parentAddress?: string;
  note?: string;
  /** Set when this baptism has an external certificate (baptized in another parish). */
  externalCertificatePath?: string | null;
  /** Issuing parish name for the external certificate. */
  externalCertificateIssuingParish?: string | null;
}

export interface BaptismRequest {
  baptismName: string;
  otherNames: string;
  surname: string;
  gender: string;
  dateOfBirth: string;
  fathersName: string;
  mothersName: string;
  sponsorNames: string;
  officiatingPriest: string;
  parishId?: number;
  address?: string;
  parishAddress?: string;
  parentAddress?: string;
}

export interface ParishResponse {
  id: number;
  parishName: string;
  dioceseId: number;
  description?: string;
}

export interface DioceseResponse {
  id: number;
  name: string;
  dioceseName?: string;
}

export async function fetchDioceses(): Promise<DioceseResponse[]> {
  const res = await fetchWithRetry(`${getBaseUrl()}/api/dioceses`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(res.status === 401 ? 'Unauthorized' : 'Failed to fetch dioceses');
  const raw = await res.json();
  if (!Array.isArray(raw)) return [];
  return raw.map((item: any) => {
    const id = Number(item?.id);
    const resolvedName = String(item?.name ?? item?.dioceseName ?? '').trim();
    return {
      id: Number.isNaN(id) ? 0 : id,
      name: resolvedName || `Diocese ${Number.isNaN(id) ? '' : id}`.trim(),
      dioceseName: item?.dioceseName,
    };
  }).filter((d) => d.id > 0);
}

export interface DioceseWithParishesResponse {
  id: number;
  dioceseName: string;
  code?: string;
  description?: string;
  parishes: ParishResponse[];
}

/** Fetches all dioceses with their parishes in one request. Use for ParishContext to avoid N+1 round-trips. */
export async function fetchDiocesesWithParishes(): Promise<DioceseWithParishesResponse[]> {
  const res = await fetchWithRetry(`${getBaseUrl()}/api/dioceses/with-parishes`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(res.status === 401 ? 'Unauthorized' : 'Failed to fetch dioceses');
  return res.json();
}

export async function fetchParishes(dioceseId: number): Promise<ParishResponse[]> {
  const res = await fetchWithRetry(`${getBaseUrl()}/api/dioceses/${dioceseId}/parishes`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(res.status === 401 ? 'Unauthorized' : 'Failed to fetch parishes');
  return res.json();
}

export async function createDiocese(name: string): Promise<DioceseResponse> {
  const res = await fetchWithRetry(`${getBaseUrl()}/api/dioceses`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ dioceseName: name }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(parseErrorResponse(text, 'Failed to create diocese'));
  }
  return res.json();
}

export async function createParish(dioceseId: number, parishName: string): Promise<ParishResponse> {
  const res = await fetchWithRetry(`${getBaseUrl()}/api/parishes`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ parishName, dioceseId }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(parseErrorResponse(text, 'Failed to create parish'));
  }
  return res.json();
}

/** Dashboard counts for a parish. Use for accurate totals (avoids pagination undercount). */
export interface DashboardCountsResponse {
  baptisms: number;
  communions: number;
  confirmations: number;
  marriages: number;
  holyOrders: number;
}

export async function fetchDashboardCounts(parishId: number): Promise<DashboardCountsResponse> {
  const res = await fetchWithRetry(`${getBaseUrl()}/api/parishes/${parishId}/dashboard-counts`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(res.status === 401 ? 'Unauthorized' : 'Failed to fetch dashboard counts');
  return res.json();
}

/** Paginated response from sacrament list endpoints. */
export interface SacramentPageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
}

/** Raw API response may be PageImpl (flat) or PagedModel (content + metadata). */
interface RawPageResponse<T> {
  content: T[];
  totalElements?: number;
  totalPages?: number;
  size?: number;
  number?: number;
  first?: boolean;
  last?: boolean;
  numberOfElements?: number;
  empty?: boolean;
  metadata?: { size: number; number: number; totalElements: number; totalPages: number };
}

function normalizePageResponse<T>(raw: RawPageResponse<T>): SacramentPageResponse<T> {
  const meta = raw.metadata;
  const size = meta?.size ?? raw.size ?? 50;
  const number = meta?.number ?? raw.number ?? 0;
  const totalElements = meta?.totalElements ?? raw.totalElements ?? 0;
  const totalPages = meta?.totalPages ?? raw.totalPages ?? Math.max(1, Math.ceil(totalElements / size));
  return {
    content: raw.content ?? [],
    totalElements,
    totalPages,
    size,
    number,
    first: raw.first ?? number === 0,
    last: raw.last ?? number >= totalPages - 1,
    numberOfElements: raw.numberOfElements ?? raw.content?.length ?? 0,
    empty: raw.empty ?? (raw.content?.length ?? 0) === 0,
  };
}

export async function fetchBaptisms(
  parishId: number,
  page = 0,
  size = 50
): Promise<SacramentPageResponse<BaptismResponse>> {
  const res = await fetchWithRetry(
    `${getBaseUrl()}/api/parishes/${parishId}/baptisms?page=${page}&size=${size}`,
    { headers: getAuthHeaders() }
  );
  if (!res.ok) throw new Error(res.status === 401 ? 'Unauthorized' : 'Failed to fetch baptisms');
  return normalizePageResponse(await res.json());
}

/** Server-side search for baptisms by name or address. Use when search query is present. */
export async function fetchBaptismsSearch(
  parishId: number,
  query: string,
  page = 0,
  size = 50
): Promise<SacramentPageResponse<BaptismResponse>> {
  const res = await fetchWithRetry(
    `${getBaseUrl()}/api/parishes/${parishId}/baptisms/search?q=${encodeURIComponent(query)}&page=${page}&size=${size}`,
    { headers: getAuthHeaders() }
  );
  if (!res.ok) throw new Error(res.status === 401 ? 'Unauthorized' : 'Failed to search baptisms');
  return normalizePageResponse(await res.json());
}

export async function fetchBaptism(id: number): Promise<BaptismResponse | null> {
  const res = await fetchWithRetry(`${getBaseUrl()}/api/baptisms/${id}`, { headers: getAuthHeaders() });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(res.status === 401 ? 'Unauthorized' : 'Failed to fetch baptism');
  return res.json();
}

/** Fetch external baptism certificate file (when baptized in another parish). Returns blob for view/download. */
export async function fetchBaptismExternalCertificate(baptismId: number): Promise<Blob> {
  const res = await fetchWithRetry(`${getBaseUrl()}/api/baptisms/${baptismId}/external-certificate`, {
    headers: getAuthHeaders(),
  });
  if (res.status === 404) throw new Error('No external certificate for this baptism');
  if (!res.ok) throw new Error(res.status === 401 ? 'Unauthorized' : 'Failed to load certificate');
  return res.blob();
}

export async function createBaptism(parishId: number, body: BaptismRequest): Promise<BaptismResponse> {
  const res = await fetchWithRetry(`${getBaseUrl()}/api/parishes/${parishId}/baptisms`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ ...body, parishId }),
  });
  if (!res.ok) {
    const text = await res.text();
    try {
      const json = JSON.parse(text) as { error?: string };
      if (json?.error && typeof json.error === 'string') throw new Error(json.error);
    } catch (e) {
      if (e instanceof Error && e.message !== 'Failed to create baptism') throw e;
    }
    throw new Error(text || 'Failed to create baptism');
  }
  return res.json();
}

export async function updateBaptismNotes(id: number, note: string): Promise<BaptismResponse> {
  const res = await fetchWithRetry(`${getBaseUrl()}/api/baptisms/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ note }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Failed to update notes');
  }
  return res.json();
}

export interface BaptismCertificateData {
  baptism: BaptismResponse;
  parishName: string;
  dioceseName: string;
}

export async function fetchBaptismCertificateData(id: number): Promise<BaptismCertificateData> {
  const res = await fetchWithRetry(`${getBaseUrl()}/api/baptisms/${id}/certificate-data`, {
    headers: getAuthHeaders(),
  });
  if (res.status === 404) throw new Error('Baptism not found');
  if (!res.ok) throw new Error(res.status === 401 ? 'Unauthorized' : 'Failed to fetch certificate data');
  return res.json();
}

export interface BaptismNoteResponse {
  id: number;
  content: string;
  createdAt: string;
  createdBy?: string;
}

export async function fetchBaptismNoteHistory(baptismId: number): Promise<BaptismNoteResponse[]> {
  const res = await fetchWithRetry(`${getBaseUrl()}/api/baptisms/${baptismId}/notes`, {
    headers: getAuthHeaders(),
  });
  if (res.status === 404) return [];
  if (!res.ok) throw new Error(res.status === 401 ? 'Unauthorized' : 'Failed to fetch note history');
  return res.json();
}

export async function emailBaptismCertificate(id: number, to: string): Promise<void> {
  const res = await fetchWithRetry(`${getBaseUrl()}/api/baptisms/${id}/email-certificate`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ to }),
  });
  if (!res.ok) {
    const text = await res.text();
    let msg = 'Failed to send certificate';
    try {
      const data = JSON.parse(text) as { error?: string };
      if (typeof data?.error === 'string') msg = data.error;
    } catch {
      if (text && text.length < 200) msg = text;
    }
    throw new Error(msg);
  }
}

export interface FirstHolyCommunionResponse {
  id: number;
  createdAt?: string;
  note?: string;
  baptismId: number;
  communionDate: string;
  officiatingPriest: string;
  parish: string;
  baptismCertificatePath?: string | null;
  communionCertificatePath?: string | null;
  /** From baptism (when loaded with communion). */
  baptismName?: string;
  otherNames?: string;
  surname?: string;
  dateOfBirth?: string;
  baptismParishName?: string;
  gender?: string;
  fathersName?: string;
  mothersName?: string;
}

export interface FirstHolyCommunionRequest {
  baptismId: number;
  communionDate: string;
  officiatingPriest: string;
  parish: string;
  /** When provided (e.g. after creating baptism with certificate), stored on communion so baptism record can show uploaded cert. */
  baptismCertificatePath?: string;
}

export async function fetchCommunions(
  parishId: number,
  page = 0,
  size = 50
): Promise<SacramentPageResponse<FirstHolyCommunionResponse>> {
  const res = await fetchWithRetry(
    `${getBaseUrl()}/api/parishes/${parishId}/communions?page=${page}&size=${size}`,
    { headers: getAuthHeaders() }
  );
  if (!res.ok) throw new Error(res.status === 401 ? 'Unauthorized' : 'Failed to fetch communions');
  return normalizePageResponse(await res.json());
}

export async function fetchCommunion(id: number): Promise<FirstHolyCommunionResponse | null> {
  const res = await fetchWithRetry(`${getBaseUrl()}/api/communions/${id}`, { headers: getAuthHeaders() });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(res.status === 401 ? 'Unauthorized' : 'Failed to fetch communion');
  return res.json();
}

/** Fetches the uploaded communion certificate file (when communion was received in another church). */
export async function fetchCommunionCertificate(communionId: number): Promise<Blob> {
  const res = await fetchWithRetry(`${getBaseUrl()}/api/communions/${communionId}/communion-certificate`, {
    headers: getAuthHeaders(),
  });
  if (res.status === 404) throw new Error('No uploaded communion certificate for this record');
  if (!res.ok) throw new Error(res.status === 401 ? 'Unauthorized' : 'Failed to load certificate');
  return res.blob();
}

export async function createCommunion(body: FirstHolyCommunionRequest): Promise<FirstHolyCommunionResponse> {
  const res = await fetchWithRetry(`${getBaseUrl()}/api/communions`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Failed to create communion');
  }
  return res.json();
}

/** Payload for "Baptism from another Parish": saved into the created baptism record. */
export interface ExternalBaptismPayload {
  baptismName: string;
  surname: string;
  otherNames: string;
  gender: string;
  fathersName: string;
  mothersName: string;
  baptisedChurchAddress: string;
}

/** Create only external baptism (with certificate). Returns the created baptism id and certificate path for linking to communion. */
export async function createBaptismWithCertificate(
  parishId: number,
  certificate: File,
  externalBaptism: ExternalBaptismPayload
): Promise<{ id: number; certificatePath: string }> {
  const formData = new FormData();
  formData.set('parishId', String(parishId));
  formData.set('certificate', certificate);
  formData.set('externalBaptismName', externalBaptism.baptismName);
  formData.set('externalSurname', externalBaptism.surname);
  formData.set('externalOtherNames', externalBaptism.otherNames);
  formData.set('externalGender', externalBaptism.gender);
  formData.set('externalFathersName', externalBaptism.fathersName);
  formData.set('externalMothersName', externalBaptism.mothersName);
  formData.set('externalBaptisedChurchAddress', externalBaptism.baptisedChurchAddress);

  const token = getStoredToken();
  const headers: HeadersInit = {};
  if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;

  const res = await fetchWithRetry(`${getBaseUrl()}/api/baptisms`, {
    method: 'POST',
    headers,
    body: formData,
  });
  if (!res.ok) {
    const text = await res.text();
    let msg = text;
    try {
      const json = JSON.parse(text) as { error?: string };
      if (typeof json?.error === 'string') msg = json.error;
    } catch {
      if (!text) msg = 'Failed to create baptism';
    }
    throw new Error(msg);
  }
  return res.json();
}

/** Create communion with "Baptism from another Parish": uploads certificate and creates baptism with given details. */
export async function createCommunionWithCertificate(
  parishId: number,
  data: { communionDate: string; officiatingPriest: string; parish: string },
  certificate: File,
  externalBaptism: ExternalBaptismPayload
): Promise<FirstHolyCommunionResponse> {
  const formData = new FormData();
  formData.set('baptismSource', 'external');
  formData.set('parishId', String(parishId));
  formData.set('communionDate', data.communionDate);
  formData.set('officiatingPriest', data.officiatingPriest);
  formData.set('parish', data.parish);
  formData.set('certificate', certificate);
  formData.set('externalBaptismName', externalBaptism.baptismName);
  formData.set('externalSurname', externalBaptism.surname);
  formData.set('externalOtherNames', externalBaptism.otherNames);
  formData.set('externalGender', externalBaptism.gender);
  formData.set('externalFathersName', externalBaptism.fathersName);
  formData.set('externalMothersName', externalBaptism.mothersName);
  formData.set('externalBaptisedChurchAddress', externalBaptism.baptisedChurchAddress);

  const token = getStoredToken();
  const headers: HeadersInit = {};
  if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  // Do not set Content-Type; browser sets multipart/form-data with boundary

  const res = await fetchWithRetry(`${getBaseUrl()}/api/communions`, {
    method: 'POST',
    headers,
    body: formData,
  });
  if (!res.ok) {
    const text = await res.text();
    let msg = text;
    try {
      const json = JSON.parse(text) as { error?: string };
      if (typeof json?.error === 'string') msg = json.error;
    } catch {
      if (!text) msg = 'Failed to create communion';
    }
    throw new Error(msg);
  }
  return res.json();
}

/** Create communion when Holy Communion was in another church: upload communion certificate, link to existing baptism. Optional baptismCertificatePath when baptism was just created with certificate (e.g. from confirmation flow). */
export async function createCommunionWithCommunionCertificate(
  data: { baptismId: number; communionDate: string; officiatingPriest: string; parish: string },
  certificate: File,
  baptismCertificatePath?: string
): Promise<FirstHolyCommunionResponse> {
  const formData = new FormData();
  formData.set('communionSource', 'external');
  formData.set('baptismId', String(data.baptismId));
  formData.set('communionDate', data.communionDate);
  formData.set('officiatingPriest', data.officiatingPriest);
  formData.set('parish', data.parish);
  formData.set('communionCertificate', certificate);
  if (baptismCertificatePath) {
    formData.set('baptismCertificatePath', baptismCertificatePath);
  }

  const token = getStoredToken();
  const headers: HeadersInit = {};
  if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;

  const res = await fetchWithRetry(`${getBaseUrl()}/api/communions`, {
    method: 'POST',
    headers,
    body: formData,
  });
  if (!res.ok) {
    const text = await res.text();
    let msg = text;
    try {
      const json = JSON.parse(text) as { error?: string };
      if (typeof json?.error === 'string') msg = json.error;
    } catch {
      if (!text) msg = 'Failed to create communion';
    }
    throw new Error(msg);
  }
  return res.json();
}

export interface ConfirmationResponse {
  id: number;
  createdAt?: string;
  note?: string;
  baptismId: number;
  communionId: number;
  confirmationDate: string;
  officiatingBishop: string;
  parish?: string;
  /** Enriched from baptism when listing by parish */
  baptismName?: string;
  otherNames?: string;
  surname?: string;
  dateOfBirth?: string;
  gender?: string;
  fathersName?: string;
  mothersName?: string;
}

export interface ConfirmationRequest {
  baptismId: number;
  communionId: number;
  confirmationDate: string;
  officiatingBishop: string;
  parish?: string;
}

export async function fetchConfirmations(
  parishId: number,
  page = 0,
  size = 50
): Promise<SacramentPageResponse<ConfirmationResponse>> {
  const res = await fetchWithRetry(
    `${getBaseUrl()}/api/parishes/${parishId}/confirmations?page=${page}&size=${size}`,
    { headers: getAuthHeaders() }
  );
  if (!res.ok) throw new Error(res.status === 401 ? 'Unauthorized' : 'Failed to fetch confirmations');
  return normalizePageResponse(await res.json());
}

export async function fetchConfirmation(id: number): Promise<ConfirmationResponse | null> {
  const res = await fetchWithRetry(`${getBaseUrl()}/api/confirmations/${id}`, { headers: getAuthHeaders() });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(res.status === 401 ? 'Unauthorized' : 'Failed to fetch confirmation');
  return res.json();
}

export async function createConfirmation(body: ConfirmationRequest): Promise<ConfirmationResponse> {
  const res = await fetchWithRetry(`${getBaseUrl()}/api/confirmations`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Failed to create confirmation');
  }
  return res.json();
}

export interface MarriageResponse {
  id: number;
  createdAt?: string;
  note?: string;
  baptismId?: number;
  communionId?: number;
  confirmationId?: number;
  partnersName: string;
  marriageDate: string;
  marriageTime?: string;
  churchName?: string;
  marriageRegister?: string;
  diocese?: string;
  civilRegistryNumber?: string;
  dispensationGranted?: boolean;
  canonicalNotes?: string;
  officiatingPriest: string;
  parish: string;
  /** Groom and bride when marriage was created with full form (Supabase). */
  parties?: MarriagePartyResponse[];
  witnesses?: MarriageWitnessResponse[];
  /** Enriched fields used by marriages grid view. */
  groomName?: string;
  brideName?: string;
  groomFatherName?: string;
  groomMotherName?: string;
  brideFatherName?: string;
  brideMotherName?: string;
  witnessesDisplay?: string;
}

export interface MarriagePartyResponse {
  id: number;
  marriageId: number;
  role: 'GROOM' | 'BRIDE';
  fullName: string;
  dateOfBirth?: string | null;
  placeOfBirth?: string | null;
  nationality?: string | null;
  residentialAddress?: string | null;
  phone?: string | null;
  email?: string | null;
  occupation?: string | null;
  maritalStatus?: string | null;
  baptismId?: number | null;
  communionId?: number | null;
  confirmationId?: number | null;
  baptismCertificatePath?: string | null;
  communionCertificatePath?: string | null;
  confirmationCertificatePath?: string | null;
  baptismChurch?: string | null;
  communionChurch?: string | null;
  confirmationChurch?: string | null;
}
export interface MarriageWitnessResponse {
  id: number;
  marriageId: number;
  fullName: string;
  phone?: string | null;
  address?: string | null;
  sortOrder: number;
}

export interface MarriageRequest {
  confirmationId: number;
  partnersName: string;
  marriageDate: string;
  officiatingPriest: string;
  parish: string;
}

/** New create marriage payload: groom, bride, marriage details, witnesses */
export interface MarriagePartyPayload {
  fullName: string;
  dateOfBirth?: string;
  placeOfBirth?: string;
  nationality?: string;
  residentialAddress?: string;
  phone?: string;
  email?: string;
  occupation?: string;
  maritalStatus?: string;
  baptismId?: number;
  communionId?: number;
  confirmationId?: number;
  baptismCertificatePath?: string;
  communionCertificatePath?: string;
  confirmationCertificatePath?: string;
  baptismChurch?: string;
  communionChurch?: string;
  confirmationChurch?: string;
  baptismSource?: 'this_parish' | 'external';
  communionSource?: 'this_parish' | 'external';
  confirmationSource?: 'this_parish' | 'external';
  externalBaptism?: {
    baptismName: string;
    surname: string;
    otherNames?: string;
    gender: string;
    fathersName: string;
    mothersName: string;
    baptisedChurchAddress?: string;
  };
}

export interface CreateMarriageWithPartiesRequest {
  marriage: {
    partnersName?: string;
    parishId?: number;
    marriageDate: string;
    marriageTime?: string;
    churchName?: string;
    marriageRegister?: string;
    diocese?: string;
    civilRegistryNumber?: string;
    dispensationGranted?: boolean;
    canonicalNotes?: string;
    officiatingPriest: string;
    parish: string;
  };
  groom: MarriagePartyPayload;
  bride: MarriagePartyPayload;
  witnesses: Array<{ fullName: string; phone?: string; address?: string; sortOrder?: number }>;
}

export async function fetchMarriages(
  parishId: number,
  page = 0,
  size = 50
): Promise<SacramentPageResponse<MarriageResponse>> {
  const res = await fetchWithRetry(
    `${getBaseUrl()}/api/parishes/${parishId}/marriages?page=${page}&size=${size}`,
    { headers: getAuthHeaders() }
  );
  if (!res.ok) throw new Error(res.status === 401 ? 'Unauthorized' : 'Failed to fetch marriages');
  return normalizePageResponse(await res.json());
}

export async function fetchMarriage(id: number): Promise<MarriageResponse | null> {
  const res = await fetchWithRetry(`${getBaseUrl()}/api/marriages/${id}`, { headers: getAuthHeaders() });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(res.status === 401 ? 'Unauthorized' : 'Failed to fetch marriage');
  return res.json();
}

export async function updateCommunionNotes(id: number, note: string): Promise<FirstHolyCommunionResponse> {
  const res = await fetchWithRetry(`${getBaseUrl()}/api/communions/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ note }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Failed to update notes');
  }
  return res.json();
}

export async function fetchCommunionNoteHistory(communionId: number): Promise<BaptismNoteResponse[]> {
  const res = await fetchWithRetry(`${getBaseUrl()}/api/communions/${communionId}/notes`, {
    headers: getAuthHeaders(),
  });
  if (res.status === 404) return [];
  if (!res.ok) throw new Error(res.status === 401 ? 'Unauthorized' : 'Failed to fetch note history');
  return res.json();
}

export async function updateConfirmationNotes(id: number, note: string): Promise<ConfirmationResponse> {
  const res = await fetchWithRetry(`${getBaseUrl()}/api/confirmations/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ note }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Failed to update notes');
  }
  return res.json();
}

export async function fetchConfirmationNoteHistory(confirmationId: number): Promise<BaptismNoteResponse[]> {
  const res = await fetchWithRetry(`${getBaseUrl()}/api/confirmations/${confirmationId}/notes`, {
    headers: getAuthHeaders(),
  });
  if (res.status === 404) return [];
  if (!res.ok) throw new Error(res.status === 401 ? 'Unauthorized' : 'Failed to fetch note history');
  return res.json();
}

export async function updateMarriageNotes(id: number, note: string): Promise<MarriageResponse> {
  const res = await fetchWithRetry(`${getBaseUrl()}/api/marriages/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ note }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Failed to update notes');
  }
  return res.json();
}

export async function fetchMarriageNoteHistory(marriageId: number): Promise<BaptismNoteResponse[]> {
  const res = await fetchWithRetry(`${getBaseUrl()}/api/marriages/${marriageId}/notes`, {
    headers: getAuthHeaders(),
  });
  if (res.status === 404) return [];
  if (!res.ok) throw new Error(res.status === 401 ? 'Unauthorized' : 'Failed to fetch note history');
  return res.json();
}

export async function createMarriage(body: MarriageRequest): Promise<MarriageResponse> {
  const res = await fetchWithRetry(`${getBaseUrl()}/api/marriages`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Failed to create marriage');
  }
  return res.json();
}

export async function createMarriageWithParties(body: CreateMarriageWithPartiesRequest): Promise<MarriageResponse> {
  const res = await fetchWithRetry(`${getBaseUrl()}/api/marriages`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    let msg = text;
    try {
      const json = JSON.parse(text) as { error?: string };
      if (typeof json?.error === 'string') msg = json.error;
    } catch {
      if (!text) msg = 'Failed to create marriage';
    }
    throw new Error(msg);
  }
  return res.json();
}

/** Upload a marriage certificate (baptism, communion, or confirmation for groom/bride). Returns path to store in form. */
export async function uploadMarriageCertificate(
  parishId: number,
  file: File,
  certificateType: 'baptism' | 'communion' | 'confirmation',
  role: 'groom' | 'bride'
): Promise<{ path: string }> {
  const formData = new FormData();
  formData.set('file', file);
  formData.set('certificateType', certificateType);
  formData.set('role', role);

  const token = getStoredToken();
  const headers: HeadersInit = {};
  if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;

  const res = await fetchWithRetry(
    `${getBaseUrl()}/api/parishes/${parishId}/marriages/upload-certificate`,
    { method: 'POST', headers, body: formData }
  );
  if (!res.ok) {
    const text = await res.text();
    let msg = text;
    try {
      const json = JSON.parse(text) as { error?: string };
      if (typeof json?.error === 'string') msg = json.error;
    } catch {
      if (!text) msg = 'Failed to upload certificate';
    }
    throw new Error(msg);
  }
  return res.json();
}

/** Fetches uploaded marriage-party certificate (baptism, communion, confirmation) for groom/bride. */
export async function fetchMarriagePartyCertificate(
  marriageId: number,
  role: 'groom' | 'bride',
  type: 'baptism' | 'communion' | 'confirmation'
): Promise<Blob> {
  const res = await fetchWithRetry(
    `${getBaseUrl()}/api/marriages/${marriageId}/party-certificate?role=${role}&type=${type}`,
    { headers: getAuthHeaders() }
  );
  if (res.status === 404) throw new Error('No uploaded certificate for this party');
  if (!res.ok) throw new Error(res.status === 401 ? 'Unauthorized' : 'Failed to load certificate');
  return res.blob();
}

export interface HolyOrderResponse {
  id: number;
  baptismId: number;
  communionId: number;
  confirmationId: number;
  ordinationDate: string;
  orderType: string;
  officiatingBishop: string;
  parishId?: number;
}

export interface HolyOrderRequest {
  confirmationId: number;
  ordinationDate: string;
  orderType: string;
  officiatingBishop: string;
  parishId?: number;
}

export async function fetchHolyOrders(
  parishId: number,
  page = 0,
  size = 50
): Promise<SacramentPageResponse<HolyOrderResponse>> {
  const res = await fetchWithRetry(
    `${getBaseUrl()}/api/parishes/${parishId}/holy-orders?page=${page}&size=${size}`,
    { headers: getAuthHeaders() }
  );
  if (!res.ok) throw new Error(res.status === 401 ? 'Unauthorized' : 'Failed to fetch holy orders');
  return normalizePageResponse(await res.json());
}

export async function fetchHolyOrder(id: number): Promise<HolyOrderResponse | null> {
  const res = await fetchWithRetry(`${getBaseUrl()}/api/holy-orders/${id}`, { headers: getAuthHeaders() });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(res.status === 401 ? 'Unauthorized' : 'Failed to fetch holy order');
  return res.json();
}

export async function createHolyOrder(body: HolyOrderRequest): Promise<HolyOrderResponse> {
  const res = await fetchWithRetry(`${getBaseUrl()}/api/holy-orders`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Failed to create holy order');
  }
  return res.json();
}

/** Admin: user parish access management */
export interface UserParishAccessResponse {
  userId: number;
  username: string;
  displayName: string | null;
  role: string | null;
  defaultParishId: number | null;
  parishAccessIds: number[];
}

export interface ReplaceUserParishAccessRequest {
  parishIds: number[];
  defaultParishId?: number | null;
}

export async function listUsersWithParishAccess(): Promise<UserParishAccessResponse[]> {
  const res = await fetchWithRetry(`${getBaseUrl()}/api/admin/users/parish-access`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    if (res.status === 403) throw new Error('Admin access required');
    throw new Error(res.status === 401 ? 'Unauthorized' : 'Failed to fetch users');
  }
  const raw = await res.json();
  if (!Array.isArray(raw)) return [];
  return raw.map((u: any) => ({
    userId: Number(u.userId),
    username: String(u.username ?? ''),
    displayName: u.displayName ?? null,
    role: u.role ?? null,
    defaultParishId: u.defaultParishId != null ? Number(u.defaultParishId) : null,
    parishAccessIds: Array.isArray(u.parishAccessIds)
      ? u.parishAccessIds.map((id: unknown) => Number(id)).filter((n: number) => !Number.isNaN(n) && n > 0)
      : [],
  }));
}

export async function getUserParishAccess(userId: number): Promise<UserParishAccessResponse> {
  const res = await fetchWithRetry(`${getBaseUrl()}/api/admin/users/${userId}/parish-access`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    if (res.status === 403) throw new Error('Admin access required');
    if (res.status === 404) throw new Error('User not found');
    throw new Error(res.status === 401 ? 'Unauthorized' : 'Failed to fetch user');
  }
  const u = await res.json();
  return {
    userId: Number(u.userId),
    username: String(u.username ?? ''),
    displayName: u.displayName ?? null,
    role: u.role ?? null,
    defaultParishId: u.defaultParishId != null ? Number(u.defaultParishId) : null,
    parishAccessIds: Array.isArray(u.parishAccessIds)
      ? u.parishAccessIds.map((id: unknown) => Number(id)).filter((n: number) => !Number.isNaN(n) && n > 0)
      : [],
  };
}

export async function replaceUserParishAccess(
  userId: number,
  request: ReplaceUserParishAccessRequest
): Promise<UserParishAccessResponse> {
  const body: any = { parishIds: request.parishIds };
  if (request.defaultParishId != null && request.defaultParishId > 0) {
    body.defaultParishId = request.defaultParishId;
  }
  const res = await fetchWithRetry(`${getBaseUrl()}/api/admin/users/${userId}/parish-access`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    let msg = text;
    try {
      const json = JSON.parse(text) as { message?: string };
      if (typeof json?.message === 'string') msg = json.message;
    } catch {
      if (!text) msg = 'Failed to update parish access';
    }
    throw new Error(msg);
  }
  const u = await res.json();
  return {
    userId: Number(u.userId),
    username: String(u.username ?? ''),
    displayName: u.displayName ?? null,
    role: u.role ?? null,
    defaultParishId: u.defaultParishId != null ? Number(u.defaultParishId) : null,
    parishAccessIds: Array.isArray(u.parishAccessIds)
      ? u.parishAccessIds.map((id: unknown) => Number(id)).filter((n: number) => !Number.isNaN(n) && n > 0)
      : [],
  };
}
