'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import AddRecordDesktopOnlyMessage from '@/components/AddRecordDesktopOnlyMessage';
import { VirtualizedTableBody, VirtualizedTableContainer } from '@/components/VirtualizedTableBody';
import { VirtualizedCardList } from '@/components/VirtualizedCardList';
import { useParish } from '@/context/ParishContext';
import { useMarriages } from '@/lib/use-sacrament-lists';
import type { MarriageResponse } from '@/lib/api';

export default function MarriagesListPage() {
  const router = useRouter();
  const { parishId, loading: parishLoading } = useParish();
  const { data: marriages, isLoading: loading, error } = useMarriages(parishId);
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [genderFilter, setGenderFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const isLoading = parishLoading || (parishId !== null && loading);
  const years = useMemo(() => {
    const set = new Set<string>();
    marriages.forEach((m) => {
      if (m.marriageDate?.length >= 4) set.add(m.marriageDate.slice(0, 4));
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [marriages]);

  const filteredMarriages = useMemo(() => {
    return marriages.filter((m) => {
      if (yearFilter !== 'all' && (!m.marriageDate || m.marriageDate.slice(0, 4) !== yearFilter)) return false;
      if (genderFilter !== 'all') {
        const gender = inferGender(m);
        if (gender !== genderFilter) return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.trim().toLowerCase();
      return (
        (m.partnersName ?? '').toLowerCase().includes(q) ||
        (m.groomName ?? '').toLowerCase().includes(q) ||
        (m.brideName ?? '').toLowerCase().includes(q) ||
        (m.officiatingPriest ?? '').toLowerCase().includes(q) ||
        (m.parish ?? '').toLowerCase().includes(q) ||
        (m.diocese ?? '').toLowerCase().includes(q) ||
        (m.witnessesDisplay ?? '').toLowerCase().includes(q)
      );
    });
  }, [marriages, yearFilter, genderFilter, searchQuery]);

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
        <h1 className="text-2xl font-serif font-semibold text-sancta-maroon">Holy Matrimony</h1>
        <p className="mt-4 text-gray-600">No parish available. Add a diocese and parish first.</p>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-serif font-semibold text-sancta-maroon w-full md:w-auto text-center md:text-left">
            Marriage Records
          </h1>
          <Link
            href={`/marriages/new?parishId=${parishId}`}
            className="hidden md:inline-flex items-center gap-2 rounded-xl bg-sancta-maroon px-4 py-3 min-h-[44px] text-white font-medium hover:bg-sancta-maroon-dark"
          >
            <span aria-hidden>+</span>
            Add Marriage
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="hidden md:block rounded-xl border border-gray-200 bg-sancta-beige/80 px-4 py-2.5 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-sancta-maroon/30 focus:border-sancta-maroon"
            aria-label="Filter marriages by year"
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
            aria-label="Filter marriages by gender"
          >
            <option value="all">All Genders</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
          </select>
          <div className="relative flex-1 min-w-0 md:min-w-[220px]">
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
              placeholder="Search marriages..."
              className="w-full rounded-xl border border-gray-200 bg-white/90 md:bg-sancta-beige/80 pl-4 pr-11 md:pl-10 md:pr-4 py-3 md:py-2.5 text-base md:text-sm text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sancta-maroon/30 focus:border-sancta-maroon min-h-[48px] md:min-h-0"
              aria-label="Search marriages"
            />
          </div>
        </div>

        {filteredMarriages.length === 0 ? (
          <>
            <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm text-center">
              <p className="text-gray-600">
                {marriages.length === 0 ? 'No marriage records yet.' : 'No marriages match the current filters.'}
              </p>
              {marriages.length === 0 && (
                <Link
                  href={`/marriages/new?parishId=${parishId}`}
                  className="mt-4 hidden md:inline-flex items-center gap-2 rounded-xl bg-sancta-maroon px-4 py-3 text-white font-medium hover:bg-sancta-maroon-dark"
                >
                  <span aria-hidden>+</span>
                  Add marriage
                </Link>
              )}
            </div>
            <div className="md:hidden pt-2">
              <AddRecordDesktopOnlyMessage />
            </div>
          </>
        ) : (
          <>
            <div className="md:hidden">
              <VirtualizedCardList
                items={filteredMarriages}
                getItemKey={(m) => String(m.id)}
                renderCard={(m) => (
                  <button
                    type="button"
                    onClick={() => router.push(`/marriages/${m.id}`)}
                    className="w-full text-left rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:border-sancta-maroon/30"
                  >
                    <p className="font-semibold text-sancta-maroon">{m.partnersName}</p>
                    <p className="text-sm text-gray-700">
                      Groom: {m.groomName || splitPartners(m.partnersName).groom} · Bride: {m.brideName || splitPartners(m.partnersName).bride}
                    </p>
                    <p className="mt-1 text-sm text-gray-700">{m.marriageDate}</p>
                    <p className="text-sm text-gray-600">{m.officiatingPriest || '—'}</p>
                    <p className="text-xs text-gray-500 mt-1">{m.parish || '—'}</p>
                  </button>
                )}
              />
            </div>

            <div className="md:hidden pt-2">
              <AddRecordDesktopOnlyMessage />
            </div>

            <div className="hidden md:block overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <VirtualizedTableContainer itemCount={filteredMarriages.length}>
                {(scrollContainerRef) => (
                  <table className="min-w-[1050px] w-full table-auto" role="grid">
                    <thead>
                      <tr className="sticky top-0 z-10 border-b border-gray-200 bg-gray-50/80">
                      <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                        GROOM NAME
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                        BRIDE NAME
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                        MARRIAGE DATE
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                        GROOM&apos;S FATHER
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                        GROOM&apos;S MOTHER
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                        BRIDE&apos;S FATHER
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                        BRIDE&apos;S MOTHER
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                        <span className="inline-flex items-center gap-1">
                          DIOCESE
                          <SortChevronIcon className="h-3.5 w-3.5 text-gray-500" />
                        </span>
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                        OFFICIATING CLERGY
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                        WITNESSES
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                        CERTIFICATE
                      </th>
                    </tr>
                    </thead>
                    <VirtualizedTableBody
                      items={filteredMarriages}
                      getRowKey={(m) => String(m.id)}
                      scrollContainerRef={scrollContainerRef}
                      onRowClick={(m) => router.push(`/marriages/${m.id}`)}
                      renderRow={(m) => (
                        <>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                            {m.groomName || splitPartners(m.partnersName).groom}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                            {m.brideName || splitPartners(m.partnersName).bride}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{m.marriageDate}</td>
                          <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{m.groomFatherName || 'See Certificate'}</td>
                          <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{m.groomMotherName || 'See Certificate'}</td>
                          <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{m.brideFatherName || 'See Certificate'}</td>
                          <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{m.brideMotherName || 'See Certificate'}</td>
                          <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{m.diocese || '—'}</td>
                          <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{m.officiatingPriest || '—'}</td>
                          <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{m.witnessesDisplay || '—'}</td>
                          <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                            <Link
                              href={`/marriages/${m.id}/certificate`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sancta-maroon hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Civil Marriage Certificate
                            </Link>
                          </td>
                        </>
                      )}
                    />
                  </table>
                )}
              </VirtualizedTableContainer>
            </div>
          </>
        )}
      </div>
    </AuthenticatedLayout>
  );
}

function splitPartners(partnersName?: string): { groom: string; bride: string } {
  const raw = partnersName?.trim() ?? '';
  if (!raw) return { groom: '—', bride: '—' };
  const parts = raw.split(/\s*&\s*/);
  if (parts.length >= 2) {
    return { groom: parts[0] || '—', bride: parts.slice(1).join(' & ') || '—' };
  }
  return { groom: raw, bride: '—' };
}

function inferGender(_m: MarriageResponse): string {
  return 'MALE';
}

function SortChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}
