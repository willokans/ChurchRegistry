'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import AddRecordDesktopOnlyMessage from '@/components/AddRecordDesktopOnlyMessage';
import { PaginationControls } from '@/components/PaginationControls';
import { VirtualizedCardList } from '@/components/VirtualizedCardList';
import { useParish } from '@/context/ParishContext';
import { useHolyOrders } from '@/lib/use-sacrament-lists';
import { MONTH_LABELS, monthOptions, dayOptions } from '@/lib/date-filters';

export default function HolyOrdersListPage() {
  const { parishId, loading: parishLoading } = useParish();
  const [page, setPage] = useState(0);
  const { data: holyOrders, totalElements, totalPages, size, isLoading: loading, error } = useHolyOrders(parishId, page);
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [dayFilter, setDayFilter] = useState<string>('all');

  useEffect(() => {
    setPage(0);
  }, [parishId]);

  const years = useMemo(() => {
    const set = new Set<string>();
    holyOrders.forEach((h) => {
      if (h.ordinationDate?.length >= 4) set.add(h.ordinationDate.slice(0, 4));
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [holyOrders]);

  const filteredHolyOrders = useMemo(() => {
    return holyOrders.filter((h) => {
      if (yearFilter !== 'all' && (!h.ordinationDate || h.ordinationDate.slice(0, 4) !== yearFilter)) return false;
      if (monthFilter !== 'all' && (!h.ordinationDate || h.ordinationDate.length < 7 || h.ordinationDate.slice(5, 7) !== monthFilter)) return false;
      if (dayFilter !== 'all' && (!h.ordinationDate || h.ordinationDate.length < 10 || h.ordinationDate.slice(8, 10) !== dayFilter)) return false;
      return true;
    });
  }, [holyOrders, yearFilter, monthFilter, dayFilter]);

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
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-serif font-semibold text-sancta-maroon">Holy Order</h1>
          <span
            className="hidden md:inline-flex items-center justify-center gap-2 rounded-lg bg-gray-300 px-4 py-3 min-h-[44px] text-gray-500 font-medium cursor-not-allowed"
            title="Feature coming soon"
          >
            Add holy order (coming soon)
          </span>
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="hidden md:block rounded-xl border border-gray-200 bg-sancta-beige/80 px-4 py-2.5 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-sancta-maroon/30 focus:border-sancta-maroon"
            aria-label="Filter by year"
          >
            <option value="all">All Years</option>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="hidden md:block rounded-xl border border-gray-200 bg-sancta-beige/80 px-4 py-2.5 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-sancta-maroon/30 focus:border-sancta-maroon"
            aria-label="Filter by month"
          >
            <option value="all">All Months</option>
            {monthOptions.map((m) => (
              <option key={m} value={m}>{MONTH_LABELS[m] ?? m}</option>
            ))}
          </select>
          <select
            value={dayFilter}
            onChange={(e) => setDayFilter(e.target.value)}
            className="hidden md:block rounded-xl border border-gray-200 bg-sancta-beige/80 px-4 py-2.5 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-sancta-maroon/30 focus:border-sancta-maroon"
            aria-label="Filter by day"
          >
            <option value="all">All Days</option>
            {dayOptions.map((d) => (
              <option key={d} value={d}>{Number.parseInt(d, 10)}</option>
            ))}
          </select>
        </div>

        <div className="md:hidden">
          <AddRecordDesktopOnlyMessage />
        </div>

      {filteredHolyOrders.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm text-center">
          <p className="text-gray-600">
            {holyOrders.length === 0 ? 'No holy order records yet.' : 'No holy orders match the current filters.'}
          </p>
          {holyOrders.length === 0 && (
            <span
              className="mt-4 hidden md:inline-flex items-center justify-center rounded-lg bg-gray-300 px-4 py-3 min-h-[44px] text-gray-500 font-medium cursor-not-allowed"
              title="Feature coming soon"
            >
              Add holy order (coming soon)
            </span>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <PaginationControls
            page={page}
            totalPages={totalPages}
            totalElements={totalElements}
            size={size}
            onPageChange={setPage}
            isLoading={loading}
            ariaLabel="holy orders"
          />
          <VirtualizedCardList
            items={filteredHolyOrders}
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
      </div>
    </AuthenticatedLayout>
  );
}
