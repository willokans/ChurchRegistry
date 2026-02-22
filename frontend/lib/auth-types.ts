export interface LoginResponse {
  token: string;
  refreshToken: string;
  username: string;
  displayName: string | null;
  role: string | null;
}

export interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: { username: string; displayName: string | null; role: string | null } | null;
}
