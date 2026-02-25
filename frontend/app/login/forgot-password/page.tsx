'use client';

import { useState } from 'react';
import Link from 'next/link';

function CrossIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 32" fill="currentColor" aria-hidden>
      <path d="M9 0L15 0 14 4 14 11 20 11 22 12 22 14 20 15 14 15 14 28 15 32 9 32 10 28 10 15 4 15 2 14 2 12 4 11 10 11 10 4z" />
    </svg>
  );
}

function EnvelopeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M2.5 6.5h15v10h-15v-10z" />
      <path d="M2.5 6.5l7.5 5 7.5-5" />
    </svg>
  );
}

export default function ForgotPasswordPage() {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    // Stub: no API yet; show success message
    setTimeout(() => {
      setSubmitted(true);
      setSubmitting(false);
    }, 500);
  }

  return (
    <main className="min-h-screen bg-pattern flex flex-col items-center justify-center px-4 pt-4 pb-8 sm:py-12">
      <header className="text-center mb-4 sm:mb-8">
        <CrossIcon className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-sancta-gold mb-2" />
        <h1 className="text-3xl sm:text-4xl font-serif font-semibold text-sancta-maroon">Church Registry</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">Growing in faith together.</p>
      </header>

      <div className="w-full max-w-md bg-white/95 rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-sancta-maroon">Forgot Password?</h2>
        <p className="text-sm text-gray-600 mt-1 mb-6">
          Enter your email or phone number and we&apos;ll send you a link to reset password.
        </p>

        {submitted ? (
          <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 text-sm text-gray-700">
            <p>If an account exists for that email or phone number, you will receive a reset link. Please check your inbox.</p>
            <Link
              href="/login"
              className="mt-4 inline-block text-sancta-maroon font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-sancta-maroon/30 rounded"
            >
              Back to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="emailOrPhone" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                <EnvelopeIcon className="w-4 h-4 text-gray-500" />
                Email or Phone number
              </label>
              <input
                id="emailOrPhone"
                type="text"
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                required
                autoComplete="username"
                placeholder="e.g. 0801 234 5678 or name@parish.org"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-sancta-maroon/30 focus:border-sancta-maroon text-gray-900 placeholder-gray-500 text-base"
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
              {submitting ? 'Sending…' : 'Reset Password'}
            </button>
          </form>
        )}

        {!submitted && (
          <p className="text-center mt-6">
            <Link
              href="/login"
              className="text-sm text-sancta-maroon font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-sancta-maroon/30 rounded py-2 min-h-[44px] inline-flex items-center justify-center"
            >
              Back to Sign In
            </Link>
          </p>
        )}
      </div>
    </main>
  );
}
