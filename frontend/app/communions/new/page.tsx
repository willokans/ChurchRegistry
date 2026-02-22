'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { fetchBaptisms, createCommunion, type BaptismResponse, type FirstHolyCommunionRequest } from '@/lib/api';

export default function CommunionCreatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const parishIdParam = searchParams.get('parishId');
  const parishId = parishIdParam ? parseInt(parishIdParam, 10) : null;

  const [baptisms, setBaptisms] = useState<BaptismResponse[]>([]);
  const [loadingBaptisms, setLoadingBaptisms] = useState(!!parishId);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FirstHolyCommunionRequest>({
    baptismId: 0,
    communionDate: '',
    officiatingPriest: '',
    parish: '',
  });

  useEffect(() => {
    if (parishId === null || Number.isNaN(parishId)) return;
    let cancelled = false;
    fetchBaptisms(parishId).then((list) => {
      if (!cancelled) {
        setBaptisms(list);
        if (list.length > 0 && form.baptismId === 0) setForm((f) => ({ ...f, baptismId: list[0].id }));
      }
    }).catch(() => {
      if (!cancelled) setError('Failed to load baptisms');
    }).finally(() => {
      if (!cancelled) setLoadingBaptisms(false);
    });
    return () => { cancelled = true; };
  }, [parishId]);

  if (parishId === null || Number.isNaN(parishId)) {
    return (
      <AuthenticatedLayout>
        <h1 className="text-2xl font-serif font-semibold text-sancta-maroon">New communion</h1>
        <p className="mt-4 text-gray-600">Select a parish from the communions list first.</p>
        <Link href="/communions" className="mt-4 inline-block text-sancta-maroon hover:underline">
          Back to communions
        </Link>
      </AuthenticatedLayout>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.baptismId <= 0) return;
    setError(null);
    setSubmitting(true);
    try {
      await createCommunion(form);
      router.push('/communions');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create communion');
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingBaptisms) {
    return (
      <AuthenticatedLayout>
        <p className="text-gray-600">Loading baptisms…</p>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="mb-4">
        <Link href="/communions" className="text-sancta-maroon hover:underline">
          ← Back to communions
        </Link>
      </div>
      <h1 className="text-2xl font-serif font-semibold text-sancta-maroon">New communion</h1>
      {baptisms.length === 0 ? (
        <p className="mt-4 text-gray-600">No baptisms in this parish. Record a baptism first.</p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 max-w-xl space-y-4">
          <div>
            <label htmlFor="baptismId" className="block text-sm font-medium text-gray-700">
              Baptism
            </label>
            <select
              id="baptismId"
              required
              value={form.baptismId || ''}
              onChange={(e) => setForm((f) => ({ ...f, baptismId: parseInt(e.target.value, 10) }))}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-sancta-maroon focus:outline-none focus:ring-1 focus:ring-sancta-maroon"
            >
              <option value="">Select baptism</option>
              {baptisms.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.baptismName} {b.surname} ({b.dateOfBirth})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="communionDate" className="block text-sm font-medium text-gray-700">
              Communion date
            </label>
            <input
              id="communionDate"
              type="date"
              required
              value={form.communionDate}
              onChange={(e) => setForm((f) => ({ ...f, communionDate: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-sancta-maroon focus:outline-none focus:ring-1 focus:ring-sancta-maroon"
            />
          </div>
          <div>
            <label htmlFor="officiatingPriest" className="block text-sm font-medium text-gray-700">
              Officiating priest
            </label>
            <input
              id="officiatingPriest"
              type="text"
              required
              value={form.officiatingPriest}
              onChange={(e) => setForm((f) => ({ ...f, officiatingPriest: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-sancta-maroon focus:outline-none focus:ring-1 focus:ring-sancta-maroon"
            />
          </div>
          <div>
            <label htmlFor="parish" className="block text-sm font-medium text-gray-700">
              Parish
            </label>
            <input
              id="parish"
              type="text"
              required
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
            disabled={submitting || form.baptismId <= 0}
            className="rounded-lg bg-sancta-maroon px-4 py-2 text-white font-medium hover:bg-sancta-maroon-dark disabled:opacity-50"
          >
            {submitting ? 'Saving…' : 'Save communion'}
          </button>
        </form>
      )}
    </AuthenticatedLayout>
  );
}
