'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getStoredToken, getStoredUser, clearAuth } from '@/lib/api';
import { useParish } from '@/context/ParishContext';

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
  const { parishId, setParishId, parishes, loading: parishLoading } = useParish();

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
        <div className="flex items-center gap-2 mb-4 px-2">
          <CrossIcon className="w-8 h-8 text-sancta-gold shrink-0" />
          <span className="font-serif font-semibold text-sancta-maroon text-lg">
            Church Registry
          </span>
        </div>
        {!parishLoading && (
          <div className="mb-4 px-2">
            <label htmlFor="parish-select" className="block text-xs font-medium text-gray-500 mb-1">
              Parish
            </label>
            {parishes.length > 0 ? (
              <select
                id="parish-select"
                value={parishId ?? ''}
                onChange={(e) => setParishId(e.target.value ? Number(e.target.value) : null)}
                className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-900 focus:border-sancta-maroon focus:outline-none focus:ring-1 focus:ring-sancta-maroon"
              >
                {parishes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.parishName}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-gray-500 mb-1">No parish selected</p>
            )}
            <Link
              href="/parishes"
              className="text-xs text-sancta-maroon hover:underline"
            >
              {parishes.length > 0 ? 'Manage dioceses & parishes' : 'Add diocese & parish'}
            </Link>
          </div>
        )}
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
            <li>
              <Link
                href="/parishes"
                className="block px-3 py-2 rounded-lg text-sancta-maroon font-medium hover:bg-sancta-maroon/10"
              >
                Dioceses & Parishes
              </Link>
            </li>
            <li>
              <Link
                href="/baptisms"
                className="block px-3 py-2 rounded-lg text-sancta-maroon font-medium hover:bg-sancta-maroon/10"
              >
                Baptisms
              </Link>
            </li>
            <li>
              <Link
                href="/communions"
                className="block px-3 py-2 rounded-lg text-sancta-maroon font-medium hover:bg-sancta-maroon/10"
              >
                Holy Communion
              </Link>
            </li>
            <li>
              <Link
                href="/confirmations"
                className="block px-3 py-2 rounded-lg text-sancta-maroon font-medium hover:bg-sancta-maroon/10"
              >
                Confirmation
              </Link>
            </li>
            <li>
              <Link
                href="/marriages"
                className="block px-3 py-2 rounded-lg text-sancta-maroon font-medium hover:bg-sancta-maroon/10"
              >
                Marriage
              </Link>
            </li>
            <li>
              <Link
                href="/holy-orders"
                className="block px-3 py-2 rounded-lg text-sancta-maroon font-medium hover:bg-sancta-maroon/10"
              >
                Holy Order
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
