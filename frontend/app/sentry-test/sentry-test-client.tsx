'use client';

import * as Sentry from '@sentry/nextjs';
import { useState } from 'react';

export default function SentryTestClient() {
  const [serverErrorSent, setServerErrorSent] = useState(false);

  const throwClientError = () => {
    Sentry.captureException(new Error('Manual Sentry test error from frontend client'));
    throw new Error('Manual Sentry test error from frontend client');
  };

  const triggerServerError = async () => {
    setServerErrorSent(false);
    const response = await fetch('/api/sentry-test');
    if (!response.ok) {
      setServerErrorSent(true);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-start justify-center gap-4 p-6">
      <h1 className="text-2xl font-semibold">Sentry Test</h1>
      <p className="text-sm text-gray-700">
        Use this internal page to verify Sentry ingestion from browser and Next.js server runtime.
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={throwClientError}
          className="rounded bg-rose-700 px-4 py-2 text-sm font-medium text-white hover:bg-rose-800"
        >
          Trigger Client Error
        </button>
        <button
          type="button"
          onClick={triggerServerError}
          className="rounded bg-indigo-700 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-800"
        >
          Trigger Server Error
        </button>
      </div>
      {serverErrorSent ? (
        <p className="text-sm text-green-700">Server error endpoint responded and should appear in Sentry.</p>
      ) : null}
    </main>
  );
}
