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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!parishId) {
      setBaptisms([]);
      setCommunions([]);
      setConfirmations([]);
      setMarriages([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const [b, c, cf, m] = await Promise.all([
          fetchBaptisms(parishId),
          fetchCommunions(parishId),
          fetchConfirmations(parishId),
          fetchMarriages(parishId),
        ]);
        if (!cancelled) {
          setBaptisms(b);
          setCommunions(c);
          setConfirmations(cf);
          setMarriages(m);
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
  const year = String(currentYear);
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
  const monthly = { baptisms: new Array(12).fill(0), confirmations: new Array(12).fill(0), marriages: new Array(12).fill(0) };
  baptisms.forEach((r) => {
    if (r.dateOfBirth?.startsWith(year)) {
      const m = parseInt(r.dateOfBirth.slice(5, 7), 10) - 1;
      if (m >= 0 && m < 12) monthly.baptisms[m]++;
    }
  });
  confirmations.forEach((r) => {
    if (r.confirmationDate?.startsWith(year)) {
      const m = parseInt(r.confirmationDate.slice(5, 7), 10) - 1;
      if (m >= 0 && m < 12) monthly.confirmations[m]++;
    }
  });
  marriages.forEach((r) => {
    if (r.marriageDate?.startsWith(year)) {
      const m = parseInt(r.marriageDate.slice(5, 7), 10) - 1;
      if (m >= 0 && m < 12) monthly.marriages[m]++;
    }
  });
  const maxBar = Math.max(1, ...monthly.baptisms, ...monthly.confirmations, ...monthly.marriages);

  return {
    counts: { baptisms: baptisms.length, communions: communions.length, confirmations: confirmations.length, marriages: marriages.length },
    recent,
    monthly: { baptisms: monthly.baptisms, confirmations: monthly.confirmations, marriages: monthly.marriages },
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

            {/* Sacraments Overview bar chart */}
            <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">Sacraments overview – {currentYear}</h2>
              <div className="flex items-end gap-1 h-48">
                {monthNames.map((name, i) => (
                  <div key={name} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex gap-0.5 items-end justify-center flex-1 min-h-[80px]">
                      <div
                        className="w-full rounded-t bg-sancta-maroon/80 min-h-[4px]"
                        style={{ height: `${(monthly.baptisms[i] / maxBar) * 100}%` }}
                        title={`Baptisms: ${monthly.baptisms[i]}`}
                      />
                      <div
                        className="w-full rounded-t bg-indigo-600/80 min-h-[4px]"
                        style={{ height: `${(monthly.confirmations[i] / maxBar) * 100}%` }}
                        title={`Confirmations: ${monthly.confirmations[i]}`}
                      />
                      <div
                        className="w-full rounded-t bg-amber-700/80 min-h-[4px]"
                        style={{ height: `${(monthly.marriages[i] / maxBar) * 100}%` }}
                        title={`Marriages: ${monthly.marriages[i]}`}
                      />
                    </div>
                    <span className="text-xs text-gray-500">{name}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-gray-100">
                <span className="flex items-center gap-1.5 text-sm text-gray-600">
                  <span className="w-3 h-3 rounded bg-sancta-maroon/80" /> Baptisms
                </span>
                <span className="flex items-center gap-1.5 text-sm text-gray-600">
                  <span className="w-3 h-3 rounded bg-indigo-600/80" /> Confirmations
                </span>
                <span className="flex items-center gap-1.5 text-sm text-gray-600">
                  <span className="w-3 h-3 rounded bg-amber-700/80" /> Marriages
                </span>
              </div>
            </section>

            {/* Sacraments overview + Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-800 mb-3">Sacraments overview – {currentYear}</h2>
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
