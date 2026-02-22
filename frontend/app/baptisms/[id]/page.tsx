'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { fetchBaptism, type BaptismResponse } from '@/lib/api';

export default function BaptismViewPage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? parseInt(params.id, 10) : NaN;
  const [baptism, setBaptism] = useState<BaptismResponse | null | undefined>(undefined);

  useEffect(() => {
    if (Number.isNaN(id)) {
      setBaptism(null);
      return;
    }
    let cancelled = false;
    fetchBaptism(id).then((b) => {
      if (!cancelled) setBaptism(b ?? null);
    }).catch(() => {
      if (!cancelled) setBaptism(null);
    });
    return () => { cancelled = true; };
  }, [id]);

  if (Number.isNaN(id)) {
    return (
      <AuthenticatedLayout>
        <p className="text-red-600">Invalid baptism id.</p>
      </AuthenticatedLayout>
    );
  }

  if (baptism === undefined) {
    return (
      <AuthenticatedLayout>
        <p className="text-gray-600">Loading…</p>
      </AuthenticatedLayout>
    );
  }

  if (baptism === null) {
    return (
      <AuthenticatedLayout>
        <h1 className="text-2xl font-serif font-semibold text-sancta-maroon">Baptism</h1>
        <p className="mt-4 text-gray-600">Baptism record not found.</p>
        <Link href="/baptisms" className="mt-4 inline-block text-sancta-maroon hover:underline">
          Back to baptisms
        </Link>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="mb-4">
        <Link href="/baptisms" className="text-sancta-maroon hover:underline">
          ← Back to baptisms
        </Link>
      </div>
      <h1 className="text-2xl font-serif font-semibold text-sancta-maroon">
        {baptism.baptismName} {baptism.surname}
      </h1>
      <dl className="mt-6 grid gap-2 sm:grid-cols-2">
        <dt className="text-sm font-medium text-gray-500">Date of birth</dt>
        <dd className="text-gray-900">{baptism.dateOfBirth}</dd>
        <dt className="text-sm font-medium text-gray-500">Gender</dt>
        <dd className="text-gray-900">{baptism.gender}</dd>
        <dt className="text-sm font-medium text-gray-500">Father</dt>
        <dd className="text-gray-900">{baptism.fathersName}</dd>
        <dt className="text-sm font-medium text-gray-500">Mother</dt>
        <dd className="text-gray-900">{baptism.mothersName}</dd>
        <dt className="text-sm font-medium text-gray-500">Sponsors</dt>
        <dd className="text-gray-900">{baptism.sponsorNames}</dd>
        {baptism.address && (
          <>
            <dt className="text-sm font-medium text-gray-500">Address</dt>
            <dd className="text-gray-900">{baptism.address}</dd>
          </>
        )}
      </dl>
    </AuthenticatedLayout>
  );
}
