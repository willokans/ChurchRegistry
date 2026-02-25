/** When unset, use same origin so Next.js API routes are used. Set to e.g. http://localhost:8080 for an external API. */
const getApiUrl = () => process.env.NEXT_PUBLIC_API_URL ?? '';

function getBaseUrl(): string {
  const env = getApiUrl();
  if (env) return env;
  if (typeof window !== 'undefined') return window.location.origin;
  return '';
}

export async function login(username: string, password: string) {
  const res = await fetch(`${getBaseUrl()}/api/auth/login`, {
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

export interface BaptismResponse {
  id: number;
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
  address?: string;
  parishAddress?: string;
  parentAddress?: string;
  note?: string;
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
}

export async function fetchDioceses(): Promise<DioceseResponse[]> {
  const res = await fetch(`${getBaseUrl()}/api/dioceses`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(res.status === 401 ? 'Unauthorized' : 'Failed to fetch dioceses');
  return res.json();
}

export async function fetchParishes(dioceseId: number): Promise<ParishResponse[]> {
  const res = await fetch(`${getBaseUrl()}/api/dioceses/${dioceseId}/parishes`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(res.status === 401 ? 'Unauthorized' : 'Failed to fetch parishes');
  return res.json();
}

export async function createDiocese(name: string): Promise<DioceseResponse> {
  const res = await fetch(`${getBaseUrl()}/api/dioceses`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Failed to create diocese');
  }
  return res.json();
}

export async function createParish(dioceseId: number, parishName: string): Promise<ParishResponse> {
  const res = await fetch(`${getBaseUrl()}/api/dioceses/${dioceseId}/parishes`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ parishName }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Failed to create parish');
  }
  return res.json();
}

export async function fetchBaptisms(parishId: number): Promise<BaptismResponse[]> {
  const res = await fetch(`${getBaseUrl()}/api/parishes/${parishId}/baptisms`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(res.status === 401 ? 'Unauthorized' : 'Failed to fetch baptisms');
  return res.json();
}

export async function fetchBaptism(id: number): Promise<BaptismResponse | null> {
  const res = await fetch(`${getBaseUrl()}/api/baptisms/${id}`, { headers: getAuthHeaders() });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(res.status === 401 ? 'Unauthorized' : 'Failed to fetch baptism');
  return res.json();
}

export async function createBaptism(parishId: number, body: BaptismRequest): Promise<BaptismResponse> {
  const res = await fetch(`${getBaseUrl()}/api/parishes/${parishId}/baptisms`, {
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
  const res = await fetch(`${getBaseUrl()}/api/baptisms/${id}`, {
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
  const res = await fetch(`${getBaseUrl()}/api/baptisms/${id}/certificate-data`, {
    headers: getAuthHeaders(),
  });
  if (res.status === 404) throw new Error('Baptism not found');
  if (!res.ok) throw new Error(res.status === 401 ? 'Unauthorized' : 'Failed to fetch certificate data');
  return res.json();
}

export async function emailBaptismCertificate(id: number, to: string): Promise<void> {
  const res = await fetch(`${getBaseUrl()}/api/baptisms/${id}/email-certificate`, {
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
  baptismId: number;
  communionDate: string;
  officiatingPriest: string;
  parish: string;
}

export interface FirstHolyCommunionRequest {
  baptismId: number;
  communionDate: string;
  officiatingPriest: string;
  parish: string;
}

export async function fetchCommunions(parishId: number): Promise<FirstHolyCommunionResponse[]> {
  const res = await fetch(`${getBaseUrl()}/api/parishes/${parishId}/communions`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(res.status === 401 ? 'Unauthorized' : 'Failed to fetch communions');
  return res.json();
}

export async function fetchCommunion(id: number): Promise<FirstHolyCommunionResponse | null> {
  const res = await fetch(`${getBaseUrl()}/api/communions/${id}`, { headers: getAuthHeaders() });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(res.status === 401 ? 'Unauthorized' : 'Failed to fetch communion');
  return res.json();
}

export async function createCommunion(body: FirstHolyCommunionRequest): Promise<FirstHolyCommunionResponse> {
  const res = await fetch(`${getBaseUrl()}/api/communions`, {
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

export interface ConfirmationResponse {
  id: number;
  baptismId: number;
  communionId: number;
  confirmationDate: string;
  officiatingBishop: string;
  parish?: string;
}

export interface ConfirmationRequest {
  communionId: number;
  confirmationDate: string;
  officiatingBishop: string;
  parish?: string;
}

export async function fetchConfirmations(parishId: number): Promise<ConfirmationResponse[]> {
  const res = await fetch(`${getBaseUrl()}/api/parishes/${parishId}/confirmations`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(res.status === 401 ? 'Unauthorized' : 'Failed to fetch confirmations');
  return res.json();
}

export async function fetchConfirmation(id: number): Promise<ConfirmationResponse | null> {
  const res = await fetch(`${getBaseUrl()}/api/confirmations/${id}`, { headers: getAuthHeaders() });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(res.status === 401 ? 'Unauthorized' : 'Failed to fetch confirmation');
  return res.json();
}

export async function createConfirmation(body: ConfirmationRequest): Promise<ConfirmationResponse> {
  const res = await fetch(`${getBaseUrl()}/api/confirmations`, {
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
  baptismId: number;
  communionId: number;
  confirmationId: number;
  partnersName: string;
  marriageDate: string;
  officiatingPriest: string;
  parish: string;
}

export interface MarriageRequest {
  confirmationId: number;
  partnersName: string;
  marriageDate: string;
  officiatingPriest: string;
  parish: string;
}

export async function fetchMarriages(parishId: number): Promise<MarriageResponse[]> {
  const res = await fetch(`${getBaseUrl()}/api/parishes/${parishId}/marriages`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(res.status === 401 ? 'Unauthorized' : 'Failed to fetch marriages');
  return res.json();
}

export async function fetchMarriage(id: number): Promise<MarriageResponse | null> {
  const res = await fetch(`${getBaseUrl()}/api/marriages/${id}`, { headers: getAuthHeaders() });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(res.status === 401 ? 'Unauthorized' : 'Failed to fetch marriage');
  return res.json();
}

export async function createMarriage(body: MarriageRequest): Promise<MarriageResponse> {
  const res = await fetch(`${getBaseUrl()}/api/marriages`, {
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

export async function fetchHolyOrders(parishId: number): Promise<HolyOrderResponse[]> {
  const res = await fetch(`${getBaseUrl()}/api/parishes/${parishId}/holy-orders`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(res.status === 401 ? 'Unauthorized' : 'Failed to fetch holy orders');
  return res.json();
}

export async function fetchHolyOrder(id: number): Promise<HolyOrderResponse | null> {
  const res = await fetch(`${getBaseUrl()}/api/holy-orders/${id}`, { headers: getAuthHeaders() });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(res.status === 401 ? 'Unauthorized' : 'Failed to fetch holy order');
  return res.json();
}

export async function createHolyOrder(body: HolyOrderRequest): Promise<HolyOrderResponse> {
  const res = await fetch(`${getBaseUrl()}/api/holy-orders`, {
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
