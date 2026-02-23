'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { useParish } from '@/context/ParishContext';
import { fetchHolyOrders, type HolyOrderResponse } from '@/lib/api';

export default function HolyOrdersListPage() {
  const { parishId, loading: parishLoading } = useParish();
  const [holyOrders, setHolyOrders] = useState<HolyOrderResponse[]>([]);
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
        const list = await fetchHolyOrders(parishId);
        if (!cancelled) setHolyOrders(list);
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
        <h1 className="text-2xl font-serif font-semibold text-sancta-maroon">Holy Order</h1>
        <p className="mt-4 text-gray-600">No parish available. Add a diocese and parish first.</p>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-serif font-semibold text-sancta-maroon">Holy Order</h1>
        <Link
          href={`/holy-orders/new?parishId=${parishId}`}
          className="rounded-lg bg-sancta-maroon px-4 py-2 text-white font-medium hover:bg-sancta-maroon-dark"
        >
          Add holy order
        </Link>
      </div>
      {holyOrders.length === 0 ? (
        <div className="mt-6">
          <p className="text-gray-600">No holy order records yet.</p>
          <Link
            href={`/holy-orders/new?parishId=${parishId}`}
            className="mt-3 inline-block rounded-lg bg-sancta-maroon px-4 py-2 text-white font-medium hover:bg-sancta-maroon-dark"
          >
            Add holy order
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-3" role="list">
          {holyOrders.map((h) => (
            <li key={h.id}>
              <Link
                href={`/holy-orders/${h.id}`}
                className="block rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:border-sancta-maroon/30 hover:shadow"
              >
                <span className="font-medium text-gray-900">
                  Confirmation #{h.confirmationId} — {h.ordinationDate}
                </span>
                <span className="ml-2 text-sm text-gray-500">{h.orderType}</span>
                <span className="ml-2 text-sm text-gray-500">{h.officiatingBishop}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AuthenticatedLayout>
  );
}
