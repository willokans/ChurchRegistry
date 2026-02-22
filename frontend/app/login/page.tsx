'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login, storeAuth } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const res = await login(username, password);
      storeAuth(res.token, res.refreshToken, {
        username: res.username,
        displayName: res.displayName ?? null,
        role: res.role ?? null,
      });
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  }

  return (
    <main style={{ padding: '2rem', maxWidth: 400, margin: '0 auto' }}>
      <h1 style={{ marginBottom: '1.5rem' }}>Church Registry</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="username" style={{ display: 'block', marginBottom: 4 }}>
            Username
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
            style={{ width: '100%', padding: 8 }}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="password" style={{ display: 'block', marginBottom: 4 }}>
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            style={{ width: '100%', padding: 8 }}
          />
        </div>
        {error && (
          <p role="alert" style={{ color: 'crimson', marginBottom: '1rem' }}>
            {error}
          </p>
        )}
        <button type="submit" style={{ padding: '8px 16px' }}>
          Sign in
        </button>
      </form>
    </main>
  );
}
