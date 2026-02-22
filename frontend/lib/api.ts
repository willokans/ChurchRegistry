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
