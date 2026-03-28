'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { getStoredToken, resetPassword, resetPasswordByToken } from '@/lib/api';

function CrossIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 32" fill="currentColor" aria-hidden>
      <path d="M9 0L15 0 14 4 14 11 20 11 22 12 22 14 20 15 14 15 14 28 15 32 9 32 10 28 10 15 4 15 2 14 2 12 4 11 10 11 10 4z" />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <rect x="4" y="8" width="12" height="8" rx="1" />
      <path d="M6 8V5a4 4 0 018 0v3" />
    </svg>
  );
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M10 4C5.5 4 2 10 2 10s3.5 6 8 6 8-6 8-6-3.5-6-8-6z" />
      <circle cx="10" cy="10" r="2.5" />
    </svg>
  );
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M3 3l14 14M11 11a2 2 0 01-2.8-2.8M7 5C4 6.5 2 10 2 10s2 4 5 5M13 15c2.5-1 4-4 4-4s-1.5-3-4-4" />
    </svg>
  );
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRequired = searchParams.get('required') === '1';
  const tokenFromUrl = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  const isTokenFlow = Boolean(tokenFromUrl);
  const isFirstLoginFlow = isRequired && !isTokenFlow;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (isTokenFlow) return;
    if (isFirstLoginFlow) {
      const jwt = getStoredToken();
      if (!jwt) router.push('/login');
    } else {
      router.push('/login');
    }
  }, [mounted, router, isTokenFlow, isFirstLoginFlow]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setSubmitting(true);
    try {
      if (isTokenFlow && tokenFromUrl) {
        await resetPasswordByToken(tokenFromUrl, newPassword);
        window.location.href = '/login';
      } else {
        await resetPassword(newPassword);
        window.location.href = '/dashboard';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
      setSubmitting(false);
    }
  }

  if (!mounted) {
    return (
      <main className="min-h-screen bg-pattern flex flex-col items-center justify-center px-4 pt-4 pb-8 sm:py-12">
        <p className="text-gray-600">Loading…</p>
      </main>
    );
  }

  if (!isTokenFlow && !getStoredToken()) {
    return (
      <main className="min-h-screen bg-pattern flex flex-col items-center justify-center px-4 pt-4 pb-8 sm:py-12">
        <p className="text-gray-600">Redirecting to login…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-pattern flex flex-col items-center justify-center px-4 pt-4 pb-8 sm:py-12">
      <header className="text-center mb-4 sm:mb-8">
        <CrossIcon className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-sancta-gold mb-2" />
        <h1 className="text-3xl sm:text-4xl font-serif font-semibold text-sancta-maroon">Sacrament Registry</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">Growing in faith together.</p>
      </header>

      <div className="w-full max-w-md bg-white/95 rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
        <div className="mb-6 text-center">
          <h2 className="text-xl font-semibold text-sancta-maroon">
            {isFirstLoginFlow ? 'Set password' : 'Reset password'}
          </h2>
          <p className="text-sm text-gray-600 mt-0.5">
            {isFirstLoginFlow
              ? 'You must set a new password before continuing.'
              : 'Enter your new password below.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="newPassword" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
              <LockIcon className="w-4 h-4 text-gray-500" />
              New password
            </label>
            <div className="relative">
              <input
                id="newPassword"
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                className="w-full px-4 py-3 pr-14 sm:pr-12 rounded-xl border border-gray-200 bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-sancta-maroon/30 focus:border-sancta-maroon text-gray-900 placeholder-gray-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 sm:p-1 flex items-center justify-center text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-sancta-maroon/30 rounded"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOffIcon className="w-6 h-6 sm:w-5 sm:h-5" /> : <EyeIcon className="w-6 h-6 sm:w-5 sm:h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
              <LockIcon className="w-4 h-4 text-gray-500" />
              Confirm password
            </label>
            <input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="Confirm your new password"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-sancta-maroon/30 focus:border-sancta-maroon text-gray-900 placeholder-gray-500"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 min-h-[44px] rounded-xl bg-sancta-maroon hover:bg-sancta-maroon-dark text-white font-semibold focus:outline-none focus:ring-2 focus:ring-sancta-maroon focus:ring-offset-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
          >
            {submitting && (
              <svg className="animate-spin h-5 w-5 text-white shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden>
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {submitting ? 'Setting password…' : 'Set password'}
          </button>
        </form>

        <p className="text-center mt-6">
          <Link
            href="/login"
            className="text-sm text-sancta-maroon font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-sancta-maroon/30 rounded py-2 min-h-[44px] inline-flex items-center justify-center"
          >
            Back to Sign In
          </Link>
        </p>
      </div>
    </main>
  );
}
