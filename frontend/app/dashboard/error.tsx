'use client';

import { useEffect } from 'react';
import Link from 'next/link';

interface DashboardErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: DashboardErrorProps) {
  useEffect(() => {
    // Log to console for debugging (optional: send to error reporting service)
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div
      className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-8"
      role="alert"
      aria-live="assertive"
    >
      <div className="w-full max-w-md rounded-xl border border-red-200 bg-red-50/80 p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-xl"
            aria-hidden
          >
            ⚠️
          </span>
          <div>
            <h1 className="text-lg font-semibold text-red-900">Something went wrong</h1>
            <p className="mt-0.5 text-sm text-red-700">
              The dashboard could not load. This may be a temporary issue.
            </p>
          </div>
        </div>
        <p className="mt-4 rounded-lg bg-white/60 px-3 py-2 text-sm text-red-800">
          {error.message || 'An unexpected error occurred.'}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center rounded-lg bg-sancta-maroon px-4 py-2.5 text-sm font-medium text-white hover:bg-sancta-maroon-dark focus:outline-none focus:ring-2 focus:ring-sancta-maroon focus:ring-offset-2"
          >
            Try again
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sancta-maroon focus:ring-offset-2"
          >
            Back to dashboard
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-sancta-maroon focus:ring-offset-2"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
