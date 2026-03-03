'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getStoredUser } from '@/lib/api';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { useParish } from '@/context/ParishContext';
import {
  fetchBaptisms,
  fetchCommunions,
  fetchConfirmations,
  fetchMarriages,
  type BaptismResponse,
  type FirstHolyCommunionResponse,
  type ConfirmationResponse,
  type MarriageResponse,
} from '@/lib/api';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

const currentYear = new Date().getFullYear();

type RecentItem = {
  type: 'baptism' | 'communion' | 'confirmation' | 'marriage';
  label: string;
  date: string;
  id: number;
  href: string;
};

function useDashboardData(parishId: number | null) {
  const [baptisms, setBaptisms] = useState<BaptismResponse[]>([]);
  const [communions, setCommunions] = useState<FirstHolyCommunionResponse[]>([]);
  const [confirmations, setConfirmations] = useState<ConfirmationResponse[]>([]);
  const [marriages, setMarriages] = useState<MarriageResponse[]>([]);
  const [counts, setCounts] = useState({ baptisms: 0, communions: 0, confirmations: 0, marriages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!parishId) {
      setBaptisms([]);
      setCommunions([]);
      setConfirmations([]);
      setMarriages([]);
      setCounts({ baptisms: 0, communions: 0, confirmations: 0, marriages: 0 });
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const [bPage, cPage, cfPage, mPage] = await Promise.all([
          fetchBaptisms(parishId),
          fetchCommunions(parishId),
          fetchConfirmations(parishId),
          fetchMarriages(parishId),
        ]);
        if (!cancelled) {
          setBaptisms(bPage.content);
          setCommunions(cPage.content);
          setConfirmations(cfPage.content);
          setMarriages(mPage.content);
          setCounts({
            baptisms: bPage.totalElements,
            communions: cPage.totalElements,
            confirmations: cfPage.totalElements,
            marriages: mPage.totalElements,
          });
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load dashboard');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [parishId]);

  const recentItems: RecentItem[] = [];
  [...baptisms]
    .sort((a, b) => b.id - a.id)
    .slice(0, 15)
    .forEach((r) => {
      recentItems.push({
        type: 'baptism',
        label: `${r.baptismName} ${r.otherNames ? r.otherNames + ' ' : ''}${r.surname}`.trim(),
        date: r.dateOfBirth,
        id: r.id,
        href: `/baptisms/${r.id}`,
      });
    });
  communions.slice(0, 15).forEach((r) => {
    recentItems.push({
      type: 'communion',
      label: 'Holy Communion',
      date: r.communionDate,
      id: r.id,
      href: `/communions/${r.id}`,
    });
  });
  confirmations.slice(0, 15).forEach((r) => {
    recentItems.push({
      type: 'confirmation',
      label: 'Confirmation',
      date: r.confirmationDate,
      id: r.id,
      href: `/confirmations/${r.id}`,
    });
  });
  marriages.slice(0, 15).forEach((r) => {
    recentItems.push({
      type: 'marriage',
      label: r.partnersName,
      date: r.marriageDate,
      id: r.id,
      href: `/marriages/${r.id}`,
    });
  });
  recentItems.sort((a, b) => b.date.localeCompare(a.date));
  const recent = recentItems.slice(0, 8);

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthly = {
    baptisms: new Array(12).fill(0),
    communions: new Array(12).fill(0),
    confirmations: new Array(12).fill(0),
    marriages: new Array(12).fill(0),
  };
  const getMonthIndex = (primaryDate?: string, fallbackDate?: string): number | null => {
    const source = primaryDate || fallbackDate;
    if (!source) return null;
    const isoLike = source.match(/^(\d{4})-(\d{2})/);
    if (isoLike) {
      const month = Number.parseInt(isoLike[2], 10) - 1;
      return month >= 0 && month < 12 ? month : null;
    }
    const d = new Date(source);
    if (Number.isNaN(d.getTime())) return null;
    const month = d.getMonth();
    return month >= 0 && month < 12 ? month : null;
  };

  baptisms.forEach((r) => {
    const m = getMonthIndex(r.createdAt, r.dateOfBirth);
    if (m !== null) monthly.baptisms[m]++;
  });
  confirmations.forEach((r) => {
    const m = getMonthIndex(r.createdAt, r.confirmationDate);
    if (m !== null) monthly.confirmations[m]++;
  });
  communions.forEach((r) => {
    const m = getMonthIndex(r.createdAt, r.communionDate);
    if (m !== null) monthly.communions[m]++;
  });
  marriages.forEach((r) => {
    const m = getMonthIndex(r.createdAt, r.marriageDate);
    if (m !== null) monthly.marriages[m]++;
  });
  const maxBar = Math.max(1, ...monthly.baptisms, ...monthly.communions, ...monthly.confirmations, ...monthly.marriages);

  return {
    counts,
    recent,
    monthly: {
      baptisms: monthly.baptisms,
      communions: monthly.communions,
      confirmations: monthly.confirmations,
      marriages: monthly.marriages,
    },
    monthNames,
    maxBar,
    loading,
    error,
  };
}

export default function DashboardPage() {
  const user = getStoredUser();
  const { parishId, parishes } = useParish();
  const { counts, recent, monthly, monthNames, maxBar, loading, error } = useDashboardData(parishId ?? null);

  const parish = parishId ? parishes.find((p) => p.id === parishId) : undefined;
  const parishName = parish?.parishName ?? null;
  const greeting = getGreeting();
  const displayName = user?.displayName || user?.username || '…';

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        {/* Welcome + Year */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-serif font-semibold text-sancta-maroon">
              {greeting}, {displayName}
            </h1>
            <p className="mt-1 text-gray-600">
              {parishName ? `Welcome to ${parishName} Parish Registry` : 'Select a parish in the sidebar'}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
            <span>Year {currentYear}</span>
          </div>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}

        {parishId && (
          <>
            {/* Summary cards */}
            {!loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <span className="text-2xl" aria-hidden>💧</span>
                    <span className="font-medium">Baptisms</span>
                  </div>
                  <p className="mt-2 text-2xl font-semibold text-sancta-maroon">{counts.baptisms}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Records in this parish</p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <span className="text-2xl" aria-hidden>🍞</span>
                    <span className="font-medium">Holy Communion</span>
                  </div>
                  <p className="mt-2 text-2xl font-semibold text-sancta-maroon">{counts.communions}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Records in this parish</p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <span className="text-2xl" aria-hidden>✝</span>
                    <span className="font-medium">Confirmations</span>
                  </div>
                  <p className="mt-2 text-2xl font-semibold text-sancta-maroon">{counts.confirmations}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Records in this parish</p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <span className="text-2xl" aria-hidden>💒</span>
                    <span className="font-medium">Marriages</span>
                  </div>
                  <p className="mt-2 text-2xl font-semibold text-sancta-maroon">{counts.marriages}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Records in this parish</p>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">Quick Actions</h2>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/baptisms/new?parishId=${parishId}`}
                  className="inline-flex items-center gap-2 rounded-lg bg-sancta-maroon px-4 py-3 text-white font-medium hover:bg-sancta-maroon-dark min-h-[44px]"
                >
                  <span aria-hidden>+</span>
                  Register Baptism
                </Link>
                <Link
                  href={`/communions/new?parishId=${parishId}`}
                  className="inline-flex items-center gap-2 rounded-lg bg-purple-700 px-4 py-3 text-white font-medium hover:bg-purple-800 min-h-[44px]"
                >
                  <span aria-hidden>+</span>
                  Register Holy Communion
                </Link>
                <Link
                  href={`/confirmations/new?parishId=${parishId}`}
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-700 px-4 py-3 text-white font-medium hover:bg-indigo-800 min-h-[44px]"
                >
                  <span aria-hidden>+</span>
                  Register Confirmation
                </Link>
                <Link
                  href={`/marriages/new?parishId=${parishId}`}
                  className="inline-flex items-center gap-2 rounded-lg bg-amber-700 px-4 py-3 text-white font-medium hover:bg-amber-800 min-h-[44px]"
                >
                  <span aria-hidden>+</span>
                  Register Marriage
                </Link>
                <Link
                  href="/baptisms"
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-700 font-medium hover:bg-gray-50 min-h-[44px]"
                >
                  Search Records
                </Link>
              </div>
            </div>

            {/* Sacraments overview grouped (clustered) bar chart */}
            <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800 mb-1">Sacraments overview by month</h2>
              <p className="text-xs text-gray-500 mb-3">All records grouped by month of creation</p>
              <div className="overflow-x-auto pb-1">
                <div className="flex items-end gap-2 h-56 min-w-[780px] border-b border-gray-100">
                  {monthNames.map((name, i) => (
                    <div key={name} className="w-14 h-full flex flex-col items-center justify-end gap-1">
                      <div className="w-full h-44 flex gap-0.5 items-end justify-center">
                        <div
                          className="w-full rounded-t bg-sancta-maroon"
                          style={{ height: monthly.baptisms[i] > 0 ? `${Math.max(6, (monthly.baptisms[i] / maxBar) * 100)}%` : '0%' }}
                          title={`Baptisms: ${monthly.baptisms[i]}`}
                        />
                        <div
                          className="w-full rounded-t bg-indigo-600"
                          style={{ height: monthly.confirmations[i] > 0 ? `${Math.max(6, (monthly.confirmations[i] / maxBar) * 100)}%` : '0%' }}
                          title={`Confirmations: ${monthly.confirmations[i]}`}
                        />
                        <div
                          className="w-full rounded-t bg-purple-700"
                          style={{ height: monthly.communions[i] > 0 ? `${Math.max(6, (monthly.communions[i] / maxBar) * 100)}%` : '0%' }}
                          title={`Holy Communion: ${monthly.communions[i]}`}
                        />
                        <div
                          className="w-full rounded-t bg-amber-700"
                          style={{ height: monthly.marriages[i] > 0 ? `${Math.max(6, (monthly.marriages[i] / maxBar) * 100)}%` : '0%' }}
                          title={`Marriages: ${monthly.marriages[i]}`}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{name}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-gray-100">
                <span className="flex items-center gap-1.5 text-sm text-gray-600">
                  <span className="w-3 h-3 rounded bg-sancta-maroon" /> Baptisms
                </span>
                <span className="flex items-center gap-1.5 text-sm text-gray-600">
                  <span className="w-3 h-3 rounded bg-indigo-600" /> Confirmations
                </span>
                <span className="flex items-center gap-1.5 text-sm text-gray-600">
                  <span className="w-3 h-3 rounded bg-purple-700" /> Holy Communion
                </span>
                <span className="flex items-center gap-1.5 text-sm text-gray-600">
                  <span className="w-3 h-3 rounded bg-amber-700" /> Marriages
                </span>
              </div>
            </section>

            {/* Sacraments overview + Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-800 mb-3">Latest sacrament records</h2>
                {recent.length === 0 ? (
                  <p className="text-sm text-gray-500">No recent records yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {recent.slice(0, 5).map((item) => (
                      <li key={`${item.type}-${item.id}`}>
                        <Link
                          href={item.href}
                          className="flex items-center gap-2 rounded-lg py-2 px-2 -mx-2 hover:bg-gray-50 text-gray-800"
                        >
                          <span className="text-sancta-gold font-medium capitalize">{item.type}</span>
                          <span className="truncate">{item.label}</span>
                          <span className="text-xs text-gray-500 ml-auto shrink-0">{item.date}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
              <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold text-gray-800">Recent Activity</h2>
                  <Link href="/baptisms" className="text-sm text-sancta-maroon hover:underline">
                    View all
                  </Link>
                </div>
                {recent.length === 0 ? (
                  <p className="text-sm text-gray-500">No recent activity.</p>
                ) : (
                  <ul className="space-y-3">
                    {recent.slice(0, 5).map((item) => (
                      <li key={`activity-${item.type}-${item.id}`} className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-sancta-maroon/10 flex items-center justify-center text-sancta-maroon text-xs font-medium shrink-0">
                          {item.type.charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0 flex-1">
                          <Link href={item.href} className="font-medium text-gray-800 hover:text-sancta-maroon truncate block">
                            {item.label}
                          </Link>
                          <p className="text-xs text-gray-500">{item.date}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </>
        )}

        {!parishId && parishes.length === 0 && !loading && (
          <p className="text-gray-600">Add a diocese and parish to see the dashboard (admin only).</p>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
