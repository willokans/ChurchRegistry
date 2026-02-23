'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { useParish } from '@/context/ParishContext';
import { fetchHolyOrder, type HolyOrderResponse } from '@/lib/api';

export default function HolyOrderViewPage() {
  const params = useParams();
  const { parishId } = useParish();
  const id = typeof params.id === 'string' ? parseInt(params.id, 10) : NaN;
  const [holyOrder, setHolyOrder] = useState<HolyOrderResponse | null | undefined>(undefined);

  useEffect(() => {
    if (Number.isNaN(id)) {
      setHolyOrder(null);
      return;
    }
    let cancelled = false;
    fetchHolyOrder(id).then((h) => {
      if (!cancelled) setHolyOrder(h ?? null);
    }).catch(() => {
      if (!cancelled) setHolyOrder(null);
    });
    return () => { cancelled = true; };
  }, [id]);

  if (Number.isNaN(id)) {
    return (
      <AuthenticatedLayout>
        <p className="text-red-600">Invalid holy order id.</p>
      </AuthenticatedLayout>
    );
  }

  if (holyOrder === undefined) {
    return (
      <AuthenticatedLayout>
        <p className="text-gray-600">Loading…</p>
      </AuthenticatedLayout>
    );
  }

  if (holyOrder === null) {
    return (
      <AuthenticatedLayout>
        <h1 className="text-2xl font-serif font-semibold text-sancta-maroon">Holy Order</h1>
        <p className="mt-4 text-gray-600">Holy order record not found.</p>
        <Link href="/holy-orders" className="mt-4 inline-block text-sancta-maroon hover:underline">
          Back to holy orders
        </Link>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Link href="/holy-orders" className="text-sancta-maroon hover:underline">
          ← Back to holy orders
        </Link>
        {parishId != null && (
          <Link
            href={`/holy-orders/new?parishId=${parishId}`}
            className="rounded-lg bg-sancta-maroon px-4 py-2 text-white font-medium hover:bg-sancta-maroon-dark text-sm"
          >
            Add holy order
          </Link>
        )}
      </div>
      <h1 className="text-2xl font-serif font-semibold text-sancta-maroon">
        Holy Order — {holyOrder.orderType} ({holyOrder.ordinationDate})
      </h1>
      <dl className="mt-6 grid gap-2 sm:grid-cols-2">
        <dt className="text-sm font-medium text-gray-500">Ordination date</dt>
        <dd className="text-gray-900">{holyOrder.ordinationDate}</dd>
        <dt className="text-sm font-medium text-gray-500">Order type</dt>
        <dd className="text-gray-900">{holyOrder.orderType}</dd>
        <dt className="text-sm font-medium text-gray-500">Officiating bishop</dt>
        <dd className="text-gray-900">{holyOrder.officiatingBishop}</dd>
        <dt className="text-sm font-medium text-gray-500">Baptism</dt>
        <dd className="text-gray-900">
          <Link href={`/baptisms/${holyOrder.baptismId}`} className="text-sancta-maroon hover:underline">
            Baptism #{holyOrder.baptismId}
          </Link>
        </dd>
        <dt className="text-sm font-medium text-gray-500">Communion</dt>
        <dd className="text-gray-900">
          <Link href={`/communions/${holyOrder.communionId}`} className="text-sancta-maroon hover:underline">
            Communion #{holyOrder.communionId}
          </Link>
        </dd>
        <dt className="text-sm font-medium text-gray-500">Confirmation</dt>
        <dd className="text-gray-900">
          <Link href={`/confirmations/${holyOrder.confirmationId}`} className="text-sancta-maroon hover:underline">
            Confirmation #{holyOrder.confirmationId}
          </Link>
        </dd>
      </dl>
    </AuthenticatedLayout>
  );
}
