'use client';

import Link from 'next/link';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import AddRecordDesktopOnlyMessage from '@/components/AddRecordDesktopOnlyMessage';
import { VirtualizedCardList } from '@/components/VirtualizedCardList';
import { useParish } from '@/context/ParishContext';
import { useHolyOrders } from '@/lib/use-sacrament-lists';

export default function HolyOrdersListPage() {
  const { parishId, loading: parishLoading } = useParish();
  const { data: holyOrders, isLoading: loading, error } = useHolyOrders(parishId);

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
        <p role="alert" className="text-red-600">{error.message}</p>
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
          className="hidden md:inline-flex items-center justify-center gap-2 rounded-lg bg-sancta-maroon px-4 py-3 min-h-[44px] text-white font-medium hover:bg-sancta-maroon-dark"
        >
          Add holy order
        </Link>
      </div>
      <div className="md:hidden mt-2">
        <AddRecordDesktopOnlyMessage />
      </div>
      {holyOrders.length === 0 ? (
        <div className="mt-6">
          <p className="text-gray-600">No holy order records yet.</p>
          <Link
            href={`/holy-orders/new?parishId=${parishId}`}
            className="mt-3 hidden md:inline-flex items-center justify-center rounded-lg bg-sancta-maroon px-4 py-3 min-h-[44px] text-white font-medium hover:bg-sancta-maroon-dark"
          >
            Add holy order
          </Link>
        </div>
      ) : (
        <div className="mt-6">
          <VirtualizedCardList
            items={holyOrders}
            getItemKey={(h) => String(h.id)}
            renderCard={(h) => (
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
            )}
          />
        </div>
      )}
    </AuthenticatedLayout>
  );
}
