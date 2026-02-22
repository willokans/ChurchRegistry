'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { fetchMarriage, type MarriageResponse } from '@/lib/api';

export default function MarriageViewPage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? parseInt(params.id, 10) : NaN;
  const [marriage, setMarriage] = useState<MarriageResponse | null | undefined>(undefined);

  useEffect(() => {
    if (Number.isNaN(id)) {
      setMarriage(null);
      return;
    }
    let cancelled = false;
    fetchMarriage(id).then((m) => {
      if (!cancelled) setMarriage(m ?? null);
    }).catch(() => {
      if (!cancelled) setMarriage(null);
    });
    return () => { cancelled = true; };
  }, [id]);

  if (Number.isNaN(id)) {
    return (
      <AuthenticatedLayout>
        <p className="text-red-600">Invalid marriage id.</p>
      </AuthenticatedLayout>
    );
  }

  if (marriage === undefined) {
    return (
      <AuthenticatedLayout>
        <p className="text-gray-600">Loading…</p>
      </AuthenticatedLayout>
    );
  }

  if (marriage === null) {
    return (
      <AuthenticatedLayout>
        <h1 className="text-2xl font-serif font-semibold text-sancta-maroon">Holy Matrimony</h1>
        <p className="mt-4 text-gray-600">Marriage record not found.</p>
        <Link href="/marriages" className="mt-4 inline-block text-sancta-maroon hover:underline">
          Back to marriages
        </Link>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="mb-4">
        <Link href="/marriages" className="text-sancta-maroon hover:underline">
          ← Back to marriages
        </Link>
      </div>
      <h1 className="text-2xl font-serif font-semibold text-sancta-maroon">
        {marriage.partnersName}
      </h1>
      <dl className="mt-6 grid gap-2 sm:grid-cols-2">
        <dt className="text-sm font-medium text-gray-500">Marriage date</dt>
        <dd className="text-gray-900">{marriage.marriageDate}</dd>
        <dt className="text-sm font-medium text-gray-500">Officiating priest</dt>
        <dd className="text-gray-900">{marriage.officiatingPriest}</dd>
        <dt className="text-sm font-medium text-gray-500">Parish</dt>
        <dd className="text-gray-900">{marriage.parish}</dd>
        <dt className="text-sm font-medium text-gray-500">Baptism</dt>
        <dd className="text-gray-900">
          <Link href={`/baptisms/${marriage.baptismId}`} className="text-sancta-maroon hover:underline">
            Baptism #{marriage.baptismId}
          </Link>
        </dd>
        <dt className="text-sm font-medium text-gray-500">Communion</dt>
        <dd className="text-gray-900">
          <Link href={`/communions/${marriage.communionId}`} className="text-sancta-maroon hover:underline">
            Communion #{marriage.communionId}
          </Link>
        </dd>
        <dt className="text-sm font-medium text-gray-500">Confirmation</dt>
        <dd className="text-gray-900">
          <Link href={`/confirmations/${marriage.confirmationId}`} className="text-sancta-maroon hover:underline">
            Confirmation #{marriage.confirmationId}
          </Link>
        </dd>
      </dl>
    </AuthenticatedLayout>
  );
}
