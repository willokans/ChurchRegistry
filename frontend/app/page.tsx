'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredToken, getStoredUser } from '@/lib/api';

export default function HomePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const token = getStoredToken();
    const user = getStoredUser();
    if (!token || !user) {
      router.push('/login');
      return;
    }
  }, [mounted, router]);

  if (!mounted) {
    return <main style={{ padding: '2rem' }}>Loading…</main>;
  }

  const user = getStoredUser();
  const token = getStoredToken();
  if (!token || !user) {
    return <main style={{ padding: '2rem' }}>Redirecting to login…</main>;
  }

  return (
    <main style={{ padding: '2rem', maxWidth: 800, margin: '0 auto' }}>
      <h1>Church Registry</h1>
      <p style={{ marginTop: '1rem' }}>
        Welcome, {user.displayName || user.username}.
      </p>
    </main>
  );
}
