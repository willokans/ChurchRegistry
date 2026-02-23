'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { useParish } from '@/context/ParishContext';
import { fetchConfirmation, type ConfirmationResponse } from '@/lib/api';

export default function ConfirmationViewPage() {
  const params = useParams();
  const { parishId } = useParish();
  const id = typeof params.id === 'string' ? parseInt(params.id, 10) : NaN;
  const [confirmation, setConfirmation] = useState<ConfirmationResponse | null | undefined>(undefined);

  useEffect(() => {
    if (Number.isNaN(id)) {
      setConfirmation(null);
      return;
    }
    let cancelled = false;
    fetchConfirmation(id).then((c) => {
      if (!cancelled) setConfirmation(c ?? null);
    }).catch(() => {
      if (!cancelled) setConfirmation(null);
    });
    return () => { cancelled = true; };
  }, [id]);

  if (Number.isNaN(id)) {
    return (
      <AuthenticatedLayout>
        <p className="text-red-600">Invalid confirmation id.</p>
      </AuthenticatedLayout>
    );
  }

  if (confirmation === undefined) {
    return (
      <AuthenticatedLayout>
        <p className="text-gray-600">Loading…</p>
      </AuthenticatedLayout>
    );
  }

  if (confirmation === null) {
    return (
      <AuthenticatedLayout>
        <h1 className="text-2xl font-serif font-semibold text-sancta-maroon">Confirmation</h1>
        <p className="mt-4 text-gray-600">Confirmation record not found.</p>
        <Link href="/confirmations" className="mt-4 inline-block text-sancta-maroon hover:underline">
          Back to confirmations
        </Link>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Link href="/confirmations" className="text-sancta-maroon hover:underline">
          ← Back to confirmations
        </Link>
        {parishId != null && (
          <Link
            href={`/confirmations/new?parishId=${parishId}`}
            className="rounded-lg bg-sancta-maroon px-4 py-2 text-white font-medium hover:bg-sancta-maroon-dark text-sm"
          >
            Add confirmation
          </Link>
        )}
      </div>
      <h1 className="text-2xl font-serif font-semibold text-sancta-maroon">
        Confirmation — {confirmation.confirmationDate}
      </h1>
      <dl className="mt-6 grid gap-2 sm:grid-cols-2">
        <dt className="text-sm font-medium text-gray-500">Baptism</dt>
        <dd className="text-gray-900">
          <Link href={`/baptisms/${confirmation.baptismId}`} className="text-sancta-maroon hover:underline">
            Baptism #{confirmation.baptismId}
          </Link>
        </dd>
        <dt className="text-sm font-medium text-gray-500">Communion</dt>
        <dd className="text-gray-900">
          <Link href={`/communions/${confirmation.communionId}`} className="text-sancta-maroon hover:underline">
            Communion #{confirmation.communionId}
          </Link>
        </dd>
        <dt className="text-sm font-medium text-gray-500">Confirmation date</dt>
        <dd className="text-gray-900">{confirmation.confirmationDate}</dd>
        <dt className="text-sm font-medium text-gray-500">Officiating bishop</dt>
        <dd className="text-gray-900">{confirmation.officiatingBishop}</dd>
        {confirmation.parish && (
          <>
            <dt className="text-sm font-medium text-gray-500">Parish</dt>
            <dd className="text-gray-900">{confirmation.parish}</dd>
          </>
        )}
      </dl>
    </AuthenticatedLayout>
  );
}
