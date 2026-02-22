'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { fetchCommunion, type FirstHolyCommunionResponse } from '@/lib/api';

export default function CommunionViewPage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? parseInt(params.id, 10) : NaN;
  const [communion, setCommunion] = useState<FirstHolyCommunionResponse | null | undefined>(undefined);

  useEffect(() => {
    if (Number.isNaN(id)) {
      setCommunion(null);
      return;
    }
    let cancelled = false;
    fetchCommunion(id).then((c) => {
      if (!cancelled) setCommunion(c ?? null);
    }).catch(() => {
      if (!cancelled) setCommunion(null);
    });
    return () => { cancelled = true; };
  }, [id]);

  if (Number.isNaN(id)) {
    return (
      <AuthenticatedLayout>
        <p className="text-red-600">Invalid communion id.</p>
      </AuthenticatedLayout>
    );
  }

  if (communion === undefined) {
    return (
      <AuthenticatedLayout>
        <p className="text-gray-600">Loading…</p>
      </AuthenticatedLayout>
    );
  }

  if (communion === null) {
    return (
      <AuthenticatedLayout>
        <h1 className="text-2xl font-serif font-semibold text-sancta-maroon">First Holy Communion</h1>
        <p className="mt-4 text-gray-600">Communion record not found.</p>
        <Link href="/communions" className="mt-4 inline-block text-sancta-maroon hover:underline">
          Back to communions
        </Link>
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
      <h1 className="text-2xl font-serif font-semibold text-sancta-maroon">
        First Holy Communion — {communion.communionDate}
      </h1>
      <dl className="mt-6 grid gap-2 sm:grid-cols-2">
        <dt className="text-sm font-medium text-gray-500">Baptism</dt>
        <dd className="text-gray-900">
          <Link href={`/baptisms/${communion.baptismId}`} className="text-sancta-maroon hover:underline">
            Baptism #{communion.baptismId}
          </Link>
        </dd>
        <dt className="text-sm font-medium text-gray-500">Communion date</dt>
        <dd className="text-gray-900">{communion.communionDate}</dd>
        <dt className="text-sm font-medium text-gray-500">Officiating priest</dt>
        <dd className="text-gray-900">{communion.officiatingPriest}</dd>
        <dt className="text-sm font-medium text-gray-500">Parish</dt>
        <dd className="text-gray-900">{communion.parish}</dd>
      </dl>
    </AuthenticatedLayout>
  );
}
