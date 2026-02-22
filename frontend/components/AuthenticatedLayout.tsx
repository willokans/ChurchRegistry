'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getStoredToken, getStoredUser, clearAuth } from '@/lib/api';

function CrossIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 32" fill="currentColor" aria-hidden>
      <path d="M9 0L15 0 14 4 14 11 20 11 22 12 22 14 20 15 14 15 14 28 15 32 9 32 10 28 10 15 4 15 2 14 2 12 4 11 10 11 10 4z" />
    </svg>
  );
}

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
    }
  }, [mounted, router]);

  function handleLogout() {
    clearAuth();
    router.push('/login');
  }

  if (!mounted) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading…</p>
      </main>
    );
  }

  const token = getStoredToken();
  const user = getStoredUser();
  if (!token || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Redirecting to login…</p>
      </main>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-sancta-beige">
      <header className="md:hidden flex items-center justify-center gap-2 py-4 px-4 border-b border-gray-200 bg-white/80">
        <CrossIcon className="w-8 h-8 text-sancta-gold shrink-0" />
        <span className="font-serif font-semibold text-sancta-maroon text-xl">
          Church Registry
        </span>
      </header>
      <aside className="hidden md:flex md:flex-col md:w-56 md:border-r md:border-gray-200 md:bg-white/80 md:py-6 md:px-4">
        <div className="flex items-center gap-2 mb-6 px-2">
          <CrossIcon className="w-8 h-8 text-sancta-gold shrink-0" />
          <span className="font-serif font-semibold text-sancta-maroon text-lg">
            Church Registry
          </span>
        </div>
        <nav className="flex-1" aria-label="Main">
          <ul className="space-y-1">
            <li>
              <Link
                href="/"
                className="block px-3 py-2 rounded-lg text-sancta-maroon font-medium hover:bg-sancta-maroon/10"
              >
                Home
              </Link>
            </li>
          </ul>
        </nav>
        <button
          type="button"
          onClick={handleLogout}
          className="mt-auto text-left px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 text-sm"
        >
          Sign out
        </button>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="hidden md:flex items-center justify-end gap-4 py-3 px-4 border-b border-gray-200 bg-white/80">
          <span className="text-sm text-gray-600">
            {user.displayName || user.username}
          </span>
          <button
            type="button"
            onClick={handleLogout}
            className="text-sm text-sancta-maroon hover:underline"
          >
            Sign out
          </button>
        </header>
        <main className="flex-1 p-4 md:p-6 max-w-4xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
