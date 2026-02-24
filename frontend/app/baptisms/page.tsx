'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { useParish } from '@/context/ParishContext';
import { fetchBaptisms, type BaptismResponse } from '@/lib/api';

export default function BaptismsListPage() {
  const router = useRouter();
  const { parishId, loading: parishLoading } = useParish();
  const [baptisms, setBaptisms] = useState<BaptismResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (parishId === null) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const list = await fetchBaptisms(parishId);
        if (!cancelled) setBaptisms(list);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [parishId]);

  const isLoading = parishLoading || (parishId !== null && loading);

  if (isLoading) {
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
        <h1 className="text-2xl font-serif font-semibold text-sancta-maroon">Baptisms</h1>
        <p className="mt-4 text-gray-600">No parish available. Add a diocese and parish first.</p>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-serif font-semibold text-sancta-maroon">Baptisms</h1>
        <Link
          href={`/baptisms/new?parishId=${parishId}`}
          className="rounded-lg bg-sancta-maroon px-4 py-2 text-white font-medium hover:bg-sancta-maroon-dark"
        >
          Add baptism
        </Link>
      </div>
      {baptisms.length === 0 ? (
        <div className="mt-6">
          <p className="text-gray-600">No baptism records yet.</p>
          <Link
            href={`/baptisms/new?parishId=${parishId}`}
            className="mt-3 inline-block rounded-lg bg-sancta-maroon px-4 py-2 text-white font-medium hover:bg-sancta-maroon-dark"
          >
            Add baptism
          </Link>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200" role="grid">
              <thead>
                <tr className="bg-gray-50">
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Name
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Date of birth
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Gender
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Father
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Mother
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Sponsors
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {baptisms.map((b) => (
                  <tr
                    key={b.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => router.push(`/baptisms/${b.id}`)}
                    onKeyDown={(e) => e.key === 'Enter' && router.push(`/baptisms/${b.id}`)}
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="font-medium text-sancta-maroon">
                        {b.baptismName}
                        {b.otherNames ? ` ${b.otherNames}` : ''} {b.surname}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{b.dateOfBirth}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{b.gender}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{b.fathersName}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{b.mothersName}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 max-w-[200px] truncate" title={b.sponsorNames}>{b.sponsorNames}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AuthenticatedLayout>
  );
}
