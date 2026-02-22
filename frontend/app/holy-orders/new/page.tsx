'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { fetchConfirmations, createHolyOrder, type ConfirmationResponse, type HolyOrderRequest } from '@/lib/api';

export default function HolyOrderCreatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const parishIdParam = searchParams.get('parishId');
  const parishId = parishIdParam ? parseInt(parishIdParam, 10) : null;

  const [confirmations, setConfirmations] = useState<ConfirmationResponse[]>([]);
  const [loadingConfirmations, setLoadingConfirmations] = useState(!!parishId);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<HolyOrderRequest>({
    confirmationId: 0,
    ordinationDate: '',
    orderType: 'DEACON',
    officiatingBishop: '',
    parishId: undefined,
  });

  useEffect(() => {
    if (parishId === null || Number.isNaN(parishId)) return;
    let cancelled = false;
    fetchConfirmations(parishId).then((list) => {
      if (!cancelled) {
        setConfirmations(list);
        if (list.length > 0 && form.confirmationId === 0) setForm((f) => ({ ...f, confirmationId: list[0].id }));
      }
    }).catch(() => {
      if (!cancelled) setError('Failed to load confirmations');
    }).finally(() => {
      if (!cancelled) setLoadingConfirmations(false);
    });
    return () => { cancelled = true; };
  }, [parishId]);

  if (parishId === null || Number.isNaN(parishId)) {
    return (
      <AuthenticatedLayout>
        <h1 className="text-2xl font-serif font-semibold text-sancta-maroon">New holy order</h1>
        <p className="mt-4 text-gray-600">Select a parish from the holy orders list first.</p>
        <Link href="/holy-orders" className="mt-4 inline-block text-sancta-maroon hover:underline">
          Back to holy orders
        </Link>
      </AuthenticatedLayout>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.confirmationId <= 0) return;
    setError(null);
    setSubmitting(true);
    try {
      await createHolyOrder({
        ...form,
        parishId: parishId != null && parishId > 0 ? parishId : undefined,
      });
      router.push('/holy-orders');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create holy order');
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingConfirmations) {
    return (
      <AuthenticatedLayout>
        <p className="text-gray-600">Loading confirmations…</p>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="mb-4">
        <Link href="/holy-orders" className="text-sancta-maroon hover:underline">
          ← Back to holy orders
        </Link>
      </div>
      <h1 className="text-2xl font-serif font-semibold text-sancta-maroon">New holy order</h1>
      {confirmations.length === 0 ? (
        <p className="mt-4 text-gray-600">No confirmations in this parish. Record a Confirmation first.</p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 max-w-xl space-y-4">
          <div>
            <label htmlFor="confirmationId" className="block text-sm font-medium text-gray-700">
              Confirmation
            </label>
            <select
              id="confirmationId"
              required
              value={form.confirmationId || ''}
              onChange={(e) => setForm((f) => ({ ...f, confirmationId: parseInt(e.target.value, 10) }))}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-sancta-maroon focus:outline-none focus:ring-1 focus:ring-sancta-maroon"
            >
              <option value="">Select confirmation</option>
              {confirmations.map((c) => (
                <option key={c.id} value={c.id}>
                  Confirmation #{c.id} — {c.confirmationDate}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="ordinationDate" className="block text-sm font-medium text-gray-700">
              Ordination date
            </label>
            <input
              id="ordinationDate"
              type="date"
              required
              value={form.ordinationDate}
              onChange={(e) => setForm((f) => ({ ...f, ordinationDate: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-sancta-maroon focus:outline-none focus:ring-1 focus:ring-sancta-maroon"
            />
          </div>
          <div>
            <label htmlFor="orderType" className="block text-sm font-medium text-gray-700">
              Order type
            </label>
            <select
              id="orderType"
              required
              value={form.orderType}
              onChange={(e) => setForm((f) => ({ ...f, orderType: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-sancta-maroon focus:outline-none focus:ring-1 focus:ring-sancta-maroon"
            >
              <option value="DEACON">Deacon</option>
              <option value="PRIEST">Priest</option>
            </select>
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
          {error && (
            <p role="alert" className="text-red-600 text-sm">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting || form.confirmationId <= 0}
            className="rounded-lg bg-sancta-maroon px-4 py-2 text-white font-medium hover:bg-sancta-maroon-dark disabled:opacity-50"
          >
            {submitting ? 'Saving…' : 'Save holy order'}
          </button>
        </form>
      )}
    </AuthenticatedLayout>
  );
}
