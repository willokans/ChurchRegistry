'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { fetchDioceses, fetchParishes, fetchMarriages, type MarriageResponse } from '@/lib/api';

export default function MarriagesListPage() {
  const [parishId, setParishId] = useState<number | null>(null);
  const [marriages, setMarriages] = useState<MarriageResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const dioceses = await fetchDioceses();
        if (cancelled || dioceses.length === 0) {
          setLoading(false);
          return;
        }
        const parishes = await fetchParishes(dioceses[0].id);
        if (cancelled) return;
        if (parishes.length === 0) {
          setParishId(null);
          setLoading(false);
          return;
        }
        const firstParishId = parishes[0].id;
        setParishId(firstParishId);
        const list = await fetchMarriages(firstParishId);
        if (!cancelled) setMarriages(list);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <AuthenticatedLayout>
        <p className="text-gray-600">Loading…</p>
      </AuthenticatedLayout>
    );
  }

  if (error) {
    return (
      <AuthenticatedLayout>
        <p role="alert" className="text-red-600">{error}</p>
      </AuthenticatedLayout>
    );
  }

  if (parishId === null) {
    return (
      <AuthenticatedLayout>
        <h1 className="text-2xl font-serif font-semibold text-sancta-maroon">Holy Matrimony</h1>
        <p className="mt-4 text-gray-600">No parish available. Add a diocese and parish first.</p>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-serif font-semibold text-sancta-maroon">Holy Matrimony</h1>
        <Link
          href={`/marriages/new?parishId=${parishId}`}
          className="rounded-lg bg-sancta-maroon px-4 py-2 text-white font-medium hover:bg-sancta-maroon-dark"
        >
          Add marriage
        </Link>
      </div>
      {marriages.length === 0 ? (
        <p className="mt-6 text-gray-600">No marriage records yet.</p>
      ) : (
        <ul className="mt-6 space-y-3" role="list">
          {marriages.map((m) => (
            <li key={m.id}>
              <Link
                href={`/marriages/${m.id}`}
                className="block rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:border-sancta-maroon/30 hover:shadow"
              >
                <span className="font-medium text-gray-900">{m.partnersName}</span>
                <span className="ml-2 text-sm text-gray-500">{m.marriageDate}</span>
                <span className="ml-2 text-sm text-gray-500">{m.officiatingPriest}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AuthenticatedLayout>
  );
}
