'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import AddRecordDesktopOnlyMessage from '@/components/AddRecordDesktopOnlyMessage';
import { useParish } from '@/context/ParishContext';
import {
  fetchBaptisms,
  createCommunion,
  type BaptismResponse,
  type FirstHolyCommunionRequest,
} from '@/lib/api';

function fullName(b: BaptismResponse): string {
  return [b.baptismName, b.otherNames, b.surname].filter(Boolean).join(' ');
}

function formatBaptismDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function CommunionCreatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const parishIdParam = searchParams.get('parishId');
  const parishId = parishIdParam ? parseInt(parishIdParam, 10) : null;
  const { parishId: contextParishId, parishes } = useParish();
  const effectiveParishId = parishId ?? contextParishId ?? null;

  const [baptisms, setBaptisms] = useState<BaptismResponse[]>([]);
  const [loadingBaptisms, setLoadingBaptisms] = useState(!!effectiveParishId);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [baptismSource, setBaptismSource] = useState<'this_parish' | 'external'>('this_parish');
  const [searchQuery, setSearchQuery] = useState('');
  const [form, setForm] = useState<FirstHolyCommunionRequest & { remarks?: string }>({
    baptismId: 0,
    communionDate: '',
    officiatingPriest: '',
    parish: '',
    remarks: '',
  });

  useEffect(() => {
    if (effectiveParishId === null || Number.isNaN(effectiveParishId)) return;
    let cancelled = false;
    setLoadingBaptisms(true);
    fetchBaptisms(effectiveParishId)
      .then((list) => {
        if (!cancelled) {
          setBaptisms(list);
          const defaultParish = parishes.find((p) => p.id === effectiveParishId);
          setForm((f) => ({
            ...f,
            parish: defaultParish?.parishName ?? f.parish,
          }));
        }
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load baptisms');
      })
      .finally(() => {
        if (!cancelled) setLoadingBaptisms(false);
      });
    return () => { cancelled = true; };
  }, [effectiveParishId, parishes]);

  const filteredBaptisms = useMemo(() => {
    if (!searchQuery.trim()) return baptisms;
    const q = searchQuery.trim().toLowerCase();
    return baptisms.filter((b) => {
      const name = fullName(b).toLowerCase();
      const dob = (b.dateOfBirth ?? '').toLowerCase();
      const father = (b.fathersName ?? '').toLowerCase();
      const mother = (b.mothersName ?? '').toLowerCase();
      return name.includes(q) || dob.includes(q) || father.includes(q) || mother.includes(q);
    });
  }, [baptisms, searchQuery]);

  const selectedBaptism = form.baptismId
    ? baptisms.find((b) => b.id === form.baptismId)
    : null;
  const currentParishName = parishes.find((p) => p.id === effectiveParishId)?.parishName ?? '';

  if (effectiveParishId === null || Number.isNaN(effectiveParishId)) {
    return (
      <AuthenticatedLayout>
        <h1 className="text-2xl font-serif font-semibold text-sancta-maroon">New Holy Communion</h1>
        <p className="mt-4 text-gray-600">Select a parish from the communions list first.</p>
        <Link href="/communions" className="mt-4 inline-block text-sancta-maroon hover:underline">
          ← Back to Communions
        </Link>
      </AuthenticatedLayout>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (baptismSource === 'this_parish' && form.baptismId <= 0) {
      setError('Select a baptism record.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await createCommunion({
        baptismId: form.baptismId,
        communionDate: form.communionDate,
        officiatingPriest: form.officiatingPriest,
        parish: form.parish,
      });
      router.push('/communions');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create communion');
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingBaptisms) {
    return (
      <AuthenticatedLayout>
        <p className="text-gray-600">Loading…</p>
      </AuthenticatedLayout>
    );
  }

  const cardClass = 'rounded-xl border border-gray-200 bg-white p-5 shadow-sm';

  return (
    <AuthenticatedLayout>
      <div className="md:hidden space-y-4">
        <AddRecordDesktopOnlyMessage />
        <Link href="/communions" className="inline-block text-sancta-maroon hover:underline">
          ← Back to Communions
        </Link>
      </div>
      <div className="hidden md:block space-y-6">
        <div>
          <Link href="/communions" className="text-sancta-maroon hover:underline">
            ← Back to Communions
          </Link>
        </div>
        <div>
          <h1 className="text-2xl font-serif font-semibold text-sancta-maroon">New Holy Communion</h1>
          <p className="mt-1 text-gray-600">Register a parishioner&apos;s first Holy Communion.</p>
        </div>

        {baptisms.length === 0 && baptismSource === 'this_parish' ? (
          <div className={cardClass}>
            <p className="text-gray-600">No baptisms in this parish. Record a baptism first.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column: Select Baptism + Communion Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* 1. Select Baptism Record */}
              <div className={cardClass}>
                <h2 className="text-lg font-semibold text-gray-900">Select Baptism Record</h2>
                <div className="mt-4 flex flex-wrap gap-6">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="baptismSource"
                      checked={baptismSource === 'this_parish'}
                      onChange={() => setBaptismSource('this_parish')}
                      className="mt-1 text-sancta-maroon focus:ring-sancta-maroon"
                    />
                    <span>
                      <span className="font-medium text-gray-900">Baptism in this Parish</span>
                      <span className="block text-sm text-gray-500">Select if baptized in this church</span>
                    </span>
                  </label>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="baptismSource"
                      checked={baptismSource === 'external'}
                      onChange={() => setBaptismSource('external')}
                      className="mt-1 text-sancta-maroon focus:ring-sancta-maroon"
                    />
                    <span>
                      <span className="font-medium text-gray-900">Baptism from another Parish</span>
                      <span className="block text-sm text-gray-500">Select if baptized elsewhere (upload certificate)</span>
                    </span>
                  </label>
                </div>

                {baptismSource === 'this_parish' && (
                  <>
                    <div className="mt-4 flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </span>
                        <input
                          type="search"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search by name, date of birth, or parents' names"
                          className="w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2 text-sm focus:border-sancta-maroon focus:outline-none focus:ring-1 focus:ring-sancta-maroon"
                          aria-label="Search for parishioner"
                        />
                      </div>
                      <button
                        type="button"
                        className="rounded-lg bg-sancta-maroon px-4 py-2 text-white text-sm font-medium hover:bg-sancta-maroon-dark"
                      >
                        Search
                      </button>
                    </div>
                    <div className="mt-3">
                      <label htmlFor="baptismId" className="block text-sm font-medium text-gray-700">
                        Select baptism record
                      </label>
                      <select
                        id="baptismId"
                        value={form.baptismId || ''}
                        onChange={(e) => setForm((f) => ({ ...f, baptismId: parseInt(e.target.value, 10) || 0 }))}
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-sancta-maroon focus:outline-none focus:ring-1 focus:ring-sancta-maroon"
                        aria-label="Select baptism"
                      >
                        <option value="">Choose a parishioner</option>
                        {filteredBaptisms.map((b) => (
                          <option key={b.id} value={b.id}>
                            {fullName(b)} · {b.dateOfBirth}
                          </option>
                        ))}
                      </select>
                    </div>
                    {selectedBaptism && (
                      <div className="mt-4 flex items-start justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
                        <div className="flex gap-3 min-w-0">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600" aria-hidden>
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </span>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900">{fullName(selectedBaptism)}</p>
                            <p className="text-sm text-gray-600 mt-0.5">
                              Date of Baptism: {formatBaptismDate(selectedBaptism.dateOfBirth)}
                              {selectedBaptism.fathersName || selectedBaptism.mothersName
                                ? ` · Father: ${selectedBaptism.fathersName ?? '—'} · Mother: ${selectedBaptism.mothersName ?? '—'}`
                                : ''}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, baptismId: 0 }))}
                          className="shrink-0 text-sm font-medium text-sancta-maroon hover:underline"
                        >
                          Change
                        </button>
                      </div>
                    )}
                  </>
                )}

                {baptismSource === 'external' && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Upload Baptism Certificate <span className="text-red-500">(Required)</span>
                    </label>
                    <p className="mt-1 text-xs text-gray-500">Select if baptized in another parish</p>
                    <div className="mt-2 flex items-center gap-3 rounded-lg border border-dashed border-gray-300 bg-gray-50/50 px-4 py-3">
                      <span className="text-gray-400" aria-hidden>
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </span>
                      <span className="text-sm text-gray-500">No file chosen</span>
                      <label className="ml-auto cursor-pointer rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
                        Browse Files
                        <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="sr-only" />
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Communion Details */}
              <div className={cardClass}>
                <h2 className="text-lg font-semibold text-gray-900">Communion Details</h2>
                <div className="mt-4 space-y-4">
                  <div>
                    <label htmlFor="communionDate" className="block text-sm font-medium text-gray-700">
                      Communion Date <span className="text-red-500">*</span>
                    </label>
                    <div className="relative mt-1">
                      <input
                        id="communionDate"
                        type="date"
                        required
                        value={form.communionDate}
                        onChange={(e) => setForm((f) => ({ ...f, communionDate: e.target.value }))}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 focus:border-sancta-maroon focus:outline-none focus:ring-1 focus:ring-sancta-maroon"
                        aria-label="Communion date"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" aria-hidden>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </span>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="officiatingPriest" className="block text-sm font-medium text-gray-700">
                      Officiating Priest <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="officiatingPriest"
                      type="text"
                      required
                      value={form.officiatingPriest}
                      onChange={(e) => setForm((f) => ({ ...f, officiatingPriest: e.target.value }))}
                      placeholder="Enter priest's name"
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-sancta-maroon focus:outline-none focus:ring-1 focus:ring-sancta-maroon"
                      aria-label="Officiating priest"
                    />
                  </div>
                  <div>
                    <label htmlFor="parish" className="block text-sm font-medium text-gray-700">
                      Mass Venue / Parish <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="parish"
                      required
                      value={form.parish}
                      onChange={(e) => setForm((f) => ({ ...f, parish: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-sancta-maroon focus:outline-none focus:ring-1 focus:ring-sancta-maroon"
                      aria-label="Mass Venue / Parish"
                    >
                      <option value="">Select parish</option>
                      {parishes.map((p) => (
                        <option key={p.id} value={p.parishName}>
                          {p.parishName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="remarks" className="block text-sm font-medium text-gray-700">
                      Remarks (Optional)
                    </label>
                    <textarea
                      id="remarks"
                      rows={3}
                      value={form.remarks ?? ''}
                      onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))}
                      placeholder="e.g. Special notes, behavior, class, etc."
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-sancta-maroon focus:outline-none focus:ring-1 focus:ring-sancta-maroon resize-y"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right column: Baptism Certificate + Parents & Sponsors + actions */}
            <div className="space-y-6">
              {/* Baptism Certificate */}
              {selectedBaptism && (
                <div className={cardClass}>
                  <h2 className="text-lg font-semibold text-gray-900">Baptism Certificate</h2>
                  <div className="mt-4 flex gap-4">
                    <div className="h-20 w-24 shrink-0 rounded border border-gray-200 bg-gray-100 flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="min-w-0 text-sm">
                      <p className="text-gray-600">Certificate No: BAP/{selectedBaptism.id}</p>
                      <p className="text-gray-600 mt-0.5">Issue Date: —</p>
                      <div className="mt-2 flex gap-2">
                        <button type="button" className="text-sancta-maroon hover:underline font-medium">
                          View
                        </button>
                        <button type="button" className="text-sancta-maroon hover:underline font-medium">
                          Replace
                        </button>
                      </div>
                    </div>
                  </div>
                  <label className="mt-4 flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded border-gray-300 text-sancta-maroon focus:ring-sancta-maroon" />
                    <span className="text-sm text-gray-700">Mark certificate as used</span>
                  </label>
                  <p className="mt-1 text-xs text-gray-500">This updates the baptism record with Holy Communion details.</p>
                </div>
              )}

              {/* Parents & Sponsors */}
              {selectedBaptism && (
                <div className={cardClass}>
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-lg font-semibold text-gray-900">Parents & Sponsors</h2>
                    <Link
                      href={`/baptisms/${selectedBaptism.id}`}
                      className="inline-flex items-center gap-1 text-sm font-medium text-sancta-maroon hover:underline"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </Link>
                  </div>
                  <dl className="mt-4 space-y-2 text-sm">
                    <div>
                      <dt className="text-gray-500">Father</dt>
                      <dd className="font-medium text-gray-900">{selectedBaptism.fathersName || '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Mother</dt>
                      <dd className="font-medium text-gray-900">{selectedBaptism.mothersName || '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Sponsors</dt>
                      <dd className="font-medium text-gray-900">{selectedBaptism.sponsorNames || '—'}</dd>
                    </div>
                  </dl>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col gap-3">
                {error && (
                  <p role="alert" className="text-sm text-red-600">
                    {error}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={
                    submitting ||
                    (baptismSource === 'this_parish' && form.baptismId <= 0) ||
                    baptismSource === 'external'
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-sancta-maroon px-4 py-3 min-h-[44px] text-white font-medium hover:bg-sancta-maroon-dark disabled:opacity-50"
                >
                  {submitting ? (
                    'Saving…'
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Save & Register Communion
                    </>
                  )}
                </button>
                <Link
                  href="/communions"
                  className="inline-flex justify-center rounded-xl border border-gray-300 bg-white px-4 py-3 min-h-[44px] text-gray-700 font-medium hover:bg-gray-50"
                >
                  Cancel
                </Link>
                <p className="text-xs text-gray-500">* Required fields</p>
              </div>
            </div>
          </form>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
