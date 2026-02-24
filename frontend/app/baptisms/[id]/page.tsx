'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { useParish } from '@/context/ParishContext';
import { fetchBaptism, type BaptismResponse } from '@/lib/api';

export default function BaptismViewPage() {
  const params = useParams();
  const { parishId } = useParish();
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
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Link href="/baptisms" className="text-sancta-maroon hover:underline">
          ← Back to baptisms
        </Link>
        {parishId != null && (
          <Link
            href={`/baptisms/new?parishId=${parishId}`}
            className="rounded-lg bg-sancta-maroon px-4 py-2 text-white font-medium hover:bg-sancta-maroon-dark text-sm"
          >
            Add baptism
          </Link>
        )}
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
        <dt className="text-sm font-medium text-gray-500">Officiating priest</dt>
        <dd className="text-gray-900">{baptism.officiatingPriest ?? '—'}</dd>
        {(baptism.parentAddress ?? baptism.address) && (
          <>
            <dt className="text-sm font-medium text-gray-500">Parents&apos; address</dt>
            <dd className="text-gray-900">{baptism.parentAddress ?? baptism.address}</dd>
          </>
        )}
      </dl>
    </AuthenticatedLayout>
  );
}
