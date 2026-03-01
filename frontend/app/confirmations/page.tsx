'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import AddRecordDesktopOnlyMessage from '@/components/AddRecordDesktopOnlyMessage';
import { useParish } from '@/context/ParishContext';
import { fetchConfirmations, type ConfirmationResponse } from '@/lib/api';

function fullName(c: ConfirmationResponse): string {
  return [c.baptismName, c.otherNames, c.surname].filter(Boolean).join(' ');
}

function PencilIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function DotsVerticalIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="19" r="1" />
    </svg>
  );
}

export default function ConfirmationsListPage() {
  const router = useRouter();
  const { parishId, loading: parishLoading } = useParish();
  const [confirmations, setConfirmations] = useState<ConfirmationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [genderFilter, setGenderFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

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
        const list = await fetchConfirmations(parishId);
        if (!cancelled) setConfirmations(list);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [parishId]);

  const years = useMemo(() => {
    const set = new Set<string>();
    confirmations.forEach((c) => {
      if (c.confirmationDate?.length >= 4) set.add(c.confirmationDate.slice(0, 4));
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [confirmations]);

  const filteredConfirmations = useMemo(() => {
    return confirmations.filter((c) => {
      if (yearFilter !== 'all' && (!c.confirmationDate || c.confirmationDate.slice(0, 4) !== yearFilter)) return false;
      if (genderFilter !== 'all' && c.gender !== genderFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.trim().toLowerCase();
      const name = fullName(c).toLowerCase();
      const father = (c.fathersName ?? '').toLowerCase();
      const mother = (c.mothersName ?? '').toLowerCase();
      return name.includes(q) || father.includes(q) || mother.includes(q);
    });
  }, [confirmations, yearFilter, genderFilter, searchQuery]);

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
        <h1 className="text-2xl font-serif font-semibold text-sancta-maroon">Confirmation</h1>
        <p className="mt-4 text-gray-600">No parish available. Add a diocese and parish first.</p>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        {/* Title + Add Confirmation (desktop: both; mobile: title only, Add at bottom) */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-serif font-semibold text-sancta-maroon w-full md:w-auto text-center md:text-left">
            Confirmation
          </h1>
          <Link
            href={`/confirmations/new?parishId=${parishId}`}
            className="hidden md:inline-flex items-center gap-2 rounded-xl bg-sancta-maroon px-4 py-3 min-h-[44px] text-white font-medium hover:bg-sancta-maroon-dark"
          >
            <span aria-hidden>+</span>
            Add Confirmation
          </Link>
        </div>

        {/* Filters row with search */}
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
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
            className="hidden md:block rounded-xl border border-gray-200 bg-sancta-beige/80 px-4 py-2.5 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-sancta-maroon/30 focus:border-sancta-maroon"
            aria-label="Filter by gender"
          >
            <option value="all">All Genders</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
          </select>
          <div className="relative flex-1 min-w-0 md:min-w-[200px]">
            <span className="md:hidden absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" aria-hidden>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <span className="hidden md:block absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" aria-hidden>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search confirmations..."
              className="w-full rounded-xl border border-gray-200 bg-white/90 md:bg-sancta-beige/80 pl-4 pr-11 md:pl-10 md:pr-4 py-3 md:py-2.5 text-base md:text-sm text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sancta-maroon/30 focus:border-sancta-maroon min-h-[48px] md:min-h-0"
              aria-label="Search confirmations"
            />
          </div>
        </div>

        {/* Content */}
        {filteredConfirmations.length === 0 ? (
          <>
            <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm text-center">
              <p className="text-gray-600">
                {confirmations.length === 0
                  ? 'No confirmation records yet.'
                  : 'No confirmations match the current filters.'}
              </p>
              {confirmations.length === 0 && (
                <Link
                  href={`/confirmations/new?parishId=${parishId}`}
                  className="mt-4 hidden md:inline-flex items-center gap-2 rounded-xl bg-sancta-maroon px-4 py-3 text-white font-medium hover:bg-sancta-maroon-dark"
                >
                  <span aria-hidden>+</span>
                  Add Confirmation
                </Link>
              )}
            </div>
            {confirmations.length === 0 && (
              <div className="md:hidden pt-2">
                <AddRecordDesktopOnlyMessage />
              </div>
            )}
          </>
        ) : (
          <>
            {/* Mobile: card list with name, date, parents, edit/menu icons */}
            <ul className="md:hidden space-y-3" role="list">
              {filteredConfirmations.map((c) => (
                <li key={c.id}>
                  <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <button
                      type="button"
                      onClick={() => router.push(`/confirmations/${c.id}`)}
                      className="flex-1 min-w-0 text-left"
                    >
                      <span className="text-xs font-medium text-gray-500 block">Baptism name</span>
                      <span className="font-semibold text-sancta-maroon block">{c.baptismName ?? '—'}</span>
                      <span className="text-xs font-medium text-gray-500 block mt-1">Other names</span>
                      <span className="block text-sm text-gray-700">{c.otherNames || '—'}</span>
                      <span className="text-xs font-medium text-gray-500 block mt-1">Surname</span>
                      <span className="block text-sm text-gray-700">{c.surname || '—'}</span>
                      <span className="block text-sm text-gray-600 mt-1">{c.confirmationDate}</span>
                      {(c.fathersName || c.mothersName) && (
                        <span className="block text-sm text-gray-600 mt-0.5">
                          {c.fathersName}, {c.mothersName}
                        </span>
                      )}
                      {c.officiatingBishop && (
                        <span className="block text-xs text-gray-500 mt-0.5">{c.officiatingBishop}</span>
                      )}
                    </button>
                    <div className="flex flex-col gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <Link
                        href={`/confirmations/${c.id}`}
                        className="p-2 rounded-lg text-sancta-gold hover:bg-sancta-maroon/10 focus:outline-none focus:ring-2 focus:ring-sancta-maroon/30 min-h-[44px] min-w-[44px] flex items-center justify-center"
                        aria-label={`Edit ${fullName(c)}`}
                      >
                        <PencilIcon className="w-5 h-5" />
                      </Link>
                      <Link
                        href={`/confirmations/${c.id}`}
                        className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-sancta-maroon/30 min-h-[44px] min-w-[44px] flex items-center justify-center"
                        aria-label={`More options for ${fullName(c)}`}
                      >
                        <DotsVerticalIcon className="w-5 h-5" />
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="md:hidden pt-2">
              <AddRecordDesktopOnlyMessage />
            </div>

            {/* Desktop: table */}
            <div className="hidden md:block overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-0 w-full table-auto" role="grid">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50/80">
                      <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                        BAPTISM NAME
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                        OTHER NAMES
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                        SURNAME
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                        CONFIRMATION DATE
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                        GENDER
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                        FATHER
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                        MOTHER
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                        OFFICIATING BISHOP
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {filteredConfirmations.map((c) => (
                      <tr
                        key={c.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => router.push(`/confirmations/${c.id}`)}
                        onKeyDown={(e) => e.key === 'Enter' && router.push(`/confirmations/${c.id}`)}
                        className="cursor-pointer hover:bg-gray-50/80 transition-colors"
                      >
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">{c.baptismName ?? '—'}</td>
                        <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{c.otherNames || '—'}</td>
                        <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{c.surname ?? '—'}</td>
                        <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{c.confirmationDate}</td>
                        <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{c.gender ?? '—'}</td>
                        <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{c.fathersName ?? '—'}</td>
                        <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{c.mothersName ?? '—'}</td>
                        <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{c.officiatingBishop ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
