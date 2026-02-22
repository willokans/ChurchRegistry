'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { fetchCommunions, createConfirmation, type FirstHolyCommunionResponse, type ConfirmationRequest } from '@/lib/api';

export default function ConfirmationCreatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const parishIdParam = searchParams.get('parishId');
  const parishId = parishIdParam ? parseInt(parishIdParam, 10) : null;

  const [communions, setCommunions] = useState<FirstHolyCommunionResponse[]>([]);
  const [loadingCommunions, setLoadingCommunions] = useState(!!parishId);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<ConfirmationRequest>({
    communionId: 0,
    confirmationDate: '',
    officiatingBishop: '',
    parish: '',
  });

  useEffect(() => {
    if (parishId === null || Number.isNaN(parishId)) return;
    let cancelled = false;
    fetchCommunions(parishId).then((list) => {
      if (!cancelled) {
        setCommunions(list);
        if (list.length > 0 && form.communionId === 0) setForm((f) => ({ ...f, communionId: list[0].id }));
      }
    }).catch(() => {
      if (!cancelled) setError('Failed to load communions');
    }).finally(() => {
      if (!cancelled) setLoadingCommunions(false);
    });
    return () => { cancelled = true; };
  }, [parishId]);

  if (parishId === null || Number.isNaN(parishId)) {
    return (
      <AuthenticatedLayout>
        <h1 className="text-2xl font-serif font-semibold text-sancta-maroon">New confirmation</h1>
        <p className="mt-4 text-gray-600">Select a parish from the confirmations list first.</p>
        <Link href="/confirmations" className="mt-4 inline-block text-sancta-maroon hover:underline">
          Back to confirmations
        </Link>
      </AuthenticatedLayout>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.communionId <= 0) return;
    setError(null);
    setSubmitting(true);
    try {
      await createConfirmation({
        communionId: form.communionId,
        confirmationDate: form.confirmationDate,
        officiatingBishop: form.officiatingBishop,
        parish: form.parish || undefined,
      });
      router.push('/confirmations');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create confirmation');
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingCommunions) {
    return (
      <AuthenticatedLayout>
        <p className="text-gray-600">Loading communions…</p>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="mb-4">
        <Link href="/confirmations" className="text-sancta-maroon hover:underline">
          ← Back to confirmations
        </Link>
      </div>
      <h1 className="text-2xl font-serif font-semibold text-sancta-maroon">New confirmation</h1>
      {communions.length === 0 ? (
        <p className="mt-4 text-gray-600">No communions in this parish. Record a First Holy Communion first.</p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 max-w-xl space-y-4">
          <div>
            <label htmlFor="communionId" className="block text-sm font-medium text-gray-700">
              Communion
            </label>
            <select
              id="communionId"
              required
              value={form.communionId || ''}
              onChange={(e) => setForm((f) => ({ ...f, communionId: parseInt(e.target.value, 10) }))}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-sancta-maroon focus:outline-none focus:ring-1 focus:ring-sancta-maroon"
            >
              <option value="">Select communion</option>
              {communions.map((c) => (
                <option key={c.id} value={c.id}>
                  Baptism #{c.baptismId} — {c.communionDate}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="confirmationDate" className="block text-sm font-medium text-gray-700">
              Confirmation date
            </label>
            <input
              id="confirmationDate"
              type="date"
              required
              value={form.confirmationDate}
              onChange={(e) => setForm((f) => ({ ...f, confirmationDate: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-sancta-maroon focus:outline-none focus:ring-1 focus:ring-sancta-maroon"
            />
          </div>
          <div>
            <label htmlFor="officiatingBishop" className="block text-sm font-medium text-gray-700">
              Officiating bishop
            </label>
            <input
              id="officiatingBishop"
              type="text"
              required
              value={form.officiatingBishop}
              onChange={(e) => setForm((f) => ({ ...f, officiatingBishop: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-sancta-maroon focus:outline-none focus:ring-1 focus:ring-sancta-maroon"
            />
          </div>
          <div>
            <label htmlFor="parish" className="block text-sm font-medium text-gray-700">
              Parish <span className="text-gray-400">(optional)</span>
            </label>
            <input
              id="parish"
              type="text"
              value={form.parish}
              onChange={(e) => setForm((f) => ({ ...f, parish: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-sancta-maroon focus:outline-none focus:ring-1 focus:ring-sancta-maroon"
            />
          </div>
          {error && (
            <p role="alert" className="text-red-600 text-sm">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting || form.communionId <= 0}
            className="rounded-lg bg-sancta-maroon px-4 py-2 text-white font-medium hover:bg-sancta-maroon-dark disabled:opacity-50"
          >
            {submitting ? 'Saving…' : 'Save confirmation'}
          </button>
        </form>
      )}
    </AuthenticatedLayout>
  );
}
