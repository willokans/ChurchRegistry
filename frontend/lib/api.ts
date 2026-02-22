const getApiUrl = () => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export async function login(username: string, password: string) {
  const res = await fetch(`${getApiUrl()}/api/auth/login`, {
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

function getAuthHeaders(): HeadersInit {
  const token = getStoredToken();
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  return headers;
}

export interface BaptismResponse {
  id: number;
  baptismName: string;
  surname: string;
  gender: string;
  dateOfBirth: string;
  fathersName: string;
  mothersName: string;
  sponsorNames: string;
  parishId: number;
  address?: string;
  parishAddress?: string;
  parentAddress?: string;
}

export interface BaptismRequest {
  baptismName: string;
  surname: string;
  gender: string;
  dateOfBirth: string;
  fathersName: string;
  mothersName: string;
  sponsorNames: string;
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
  const res = await fetch(`${getApiUrl()}/api/dioceses`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(res.status === 401 ? 'Unauthorized' : 'Failed to fetch dioceses');
  return res.json();
}

export async function fetchParishes(dioceseId: number): Promise<ParishResponse[]> {
  const res = await fetch(`${getApiUrl()}/api/dioceses/${dioceseId}/parishes`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(res.status === 401 ? 'Unauthorized' : 'Failed to fetch parishes');
  return res.json();
}

export async function fetchBaptisms(parishId: number): Promise<BaptismResponse[]> {
  const res = await fetch(`${getApiUrl()}/api/parishes/${parishId}/baptisms`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(res.status === 401 ? 'Unauthorized' : 'Failed to fetch baptisms');
  return res.json();
}

export async function fetchBaptism(id: number): Promise<BaptismResponse | null> {
  const res = await fetch(`${getApiUrl()}/api/baptisms/${id}`, { headers: getAuthHeaders() });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(res.status === 401 ? 'Unauthorized' : 'Failed to fetch baptism');
  return res.json();
}

export async function createBaptism(parishId: number, body: BaptismRequest): Promise<BaptismResponse> {
  const res = await fetch(`${getApiUrl()}/api/parishes/${parishId}/baptisms`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ ...body, parishId }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Failed to create baptism');
  }
  return res.json();
}
