'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import AddRecordDesktopOnlyMessage from '@/components/AddRecordDesktopOnlyMessage';
import { createBaptism, type BaptismRequest } from '@/lib/api';
import { NIGERIAN_STATES } from '@/lib/nigerian-states';

type SponsorRow = { firstName: string; lastName: string };

export default function BaptismCreatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const parishIdParam = searchParams.get('parishId');
  const parishId = parishIdParam ? parseInt(parishIdParam, 10) : null;

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    baptismName: '',
    otherNames: '',
    surname: '',
    gender: 'MALE',
    dateOfBirth: '',
    fathersName: '',
    mothersName: '',
    officiatingPriest: '',
  });
  const [sponsors, setSponsors] = useState<SponsorRow[]>([{ firstName: '', lastName: '' }]);
  const [parentAddressState, setParentAddressState] = useState<string>('');
  const [parentAddressLine, setParentAddressLine] = useState<string>('');

  if (parishId === null || Number.isNaN(parishId)) {
    return (
      <AuthenticatedLayout>
        <h1 className="text-2xl font-serif font-semibold text-sancta-maroon">New baptism</h1>
        <p className="mt-4 text-gray-600">Select a parish from the baptisms list first.</p>
        <Link href="/baptisms" className="mt-4 inline-block text-sancta-maroon hover:underline">
          Back to baptisms
        </Link>
      </AuthenticatedLayout>
    );
  }

  function buildSponsorNames(): string {
    return sponsors
      .filter((s) => s.firstName.trim() || s.lastName.trim())
      .map((s) => `${s.firstName.trim()} ${s.lastName.trim()}`.trim())
      .filter(Boolean)
      .join(', ');
  }

  function validateSponsors(): string | null {
    const filled = sponsors.filter((s) => s.firstName.trim() || s.lastName.trim());
    if (filled.length < 1) return 'Enter at least one sponsor with first and last name.';
    if (filled.length > 2) return 'Enter at most two sponsors.';
    for (const s of filled) {
      if (!s.firstName.trim() || !s.lastName.trim())
        return 'Each sponsor must have both first and last name.';
    }
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const sponsorError = validateSponsors();
    if (sponsorError) {
      setError(sponsorError);
      return;
    }
    setSubmitting(true);
    try {
      const line = parentAddressLine.trim();
      const state = parentAddressState.trim();
      const parentAddress = state ? (line ? `${line}, ${state}` : state) : undefined;
      const sponsorNames = buildSponsorNames();
      await createBaptism(parishId as number, { ...form, sponsorNames, parentAddress });
      router.push('/baptisms');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create baptism');
    } finally {
      setSubmitting(false);
    }
  }

  function updateSponsor(index: number, field: 'firstName' | 'lastName', value: string) {
    setSponsors((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  }

  function removeSponsor(index: number) {
    if (sponsors.length <= 1) return;
    setSponsors((prev) => prev.filter((_, i) => i !== index));
  }

  function addSponsor() {
    if (sponsors.length >= 2) return;
    setSponsors((prev) => [...prev, { firstName: '', lastName: '' }]);
  }

  return (
    <AuthenticatedLayout>
      <div className="md:hidden space-y-4">
        <AddRecordDesktopOnlyMessage />
        <Link href="/baptisms" className="inline-block text-sancta-maroon hover:underline">
          Back to baptisms
        </Link>
      </div>
      <div className="hidden md:block">
        <div className="mb-4">
          <Link href="/baptisms" className="text-sancta-maroon hover:underline">
            ← Back to baptisms
          </Link>
        </div>
        <h1 className="text-2xl font-serif font-semibold text-sancta-maroon">Add Baptism</h1>
        <form onSubmit={handleSubmit} className="mt-6 max-w-xl space-y-4">
          <div>
            <label htmlFor="baptismName" className="block text-sm font-medium text-gray-700">
              Baptism name <span className="text-red-500">*</span>
            </label>
            <input
              id="baptismName"
              type="text"
              required
              value={form.baptismName}
              onChange={(e) => setForm((f) => ({ ...f, baptismName: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-sancta-maroon focus:outline-none focus:ring-1 focus:ring-sancta-maroon"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="otherNames" className="block text-sm font-medium text-gray-700">
                Other names
              </label>
              <p className="text-xs text-gray-500 mt-0.5">Optional</p>
              <input
                id="otherNames"
                type="text"
                value={form.otherNames}
                onChange={(e) => setForm((f) => ({ ...f, otherNames: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-sancta-maroon focus:outline-none focus:ring-1 focus:ring-sancta-maroon"
              />
            </div>
            <div>
              <label htmlFor="surname" className="block text-sm font-medium text-gray-700">
                Surname <span className="text-red-500">*</span>
              </label>
              <input
                id="surname"
                type="text"
                required
                value={form.surname}
                onChange={(e) => setForm((f) => ({ ...f, surname: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-sancta-maroon focus:outline-none focus:ring-1 focus:ring-sancta-maroon"
              />
            </div>
          </div>
          <div>
            <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
              Gender
            </label>
            <select
              id="gender"
              required
              value={form.gender}
              onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-sancta-maroon focus:outline-none focus:ring-1 focus:ring-sancta-maroon"
            >
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </select>
          </div>
          <div>
            <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">
              Date of birth <span className="text-red-500">*</span>
            </label>
            <input
              id="dateOfBirth"
              type="date"
              required
              max={new Date().toISOString().slice(0, 10)}
              value={form.dateOfBirth}
              onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-sancta-maroon focus:outline-none focus:ring-1 focus:ring-sancta-maroon"
            />
            <p className="mt-1 text-xs text-gray-500">Cannot be a future date</p>
          </div>
          <div>
            <label htmlFor="fathersName" className="block text-sm font-medium text-gray-700">
              Father&apos;s name <span className="text-red-500">*</span>
            </label>
            <input
              id="fathersName"
              type="text"
              required
              value={form.fathersName}
              onChange={(e) => setForm((f) => ({ ...f, fathersName: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-sancta-maroon focus:outline-none focus:ring-1 focus:ring-sancta-maroon"
            />
          </div>
          <div>
            <label htmlFor="mothersName" className="block text-sm font-medium text-gray-700">
              Mother&apos;s name <span className="text-red-500">*</span>
            </label>
            <input
              id="mothersName"
              type="text"
              required
              value={form.mothersName}
              onChange={(e) => setForm((f) => ({ ...f, mothersName: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-sancta-maroon focus:outline-none focus:ring-1 focus:ring-sancta-maroon"
            />
          </div>
          <div>
            <p className="block text-sm font-medium text-gray-700 mb-2">
              Sponsor <span className="text-red-500">*</span>
            </p>
            <p className="text-xs text-gray-500 mb-2">One or two sponsors; each with first and last name.</p>
            <div className="space-y-3">
              {sponsors.map((s, i) => (
                <div key={i} className="flex flex-wrap items-end gap-2">
                  <div className="flex-1 min-w-[120px]">
                    <label htmlFor={`sponsor-first-${i}`} className="block text-xs font-medium text-gray-600">
                      First name
                    </label>
                    <input
                      id={`sponsor-first-${i}`}
                      type="text"
                      value={s.firstName}
                      onChange={(e) => updateSponsor(i, 'firstName', e.target.value)}
                      className="mt-0.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-sancta-maroon focus:outline-none focus:ring-1 focus:ring-sancta-maroon"
                    />
                  </div>
                  <div className="flex-1 min-w-[120px]">
                    <label htmlFor={`sponsor-last-${i}`} className="block text-xs font-medium text-gray-600">
                      Last name
                    </label>
                    <input
                      id={`sponsor-last-${i}`}
                      type="text"
                      value={s.lastName}
                      onChange={(e) => updateSponsor(i, 'lastName', e.target.value)}
                      className="mt-0.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-sancta-maroon focus:outline-none focus:ring-1 focus:ring-sancta-maroon"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSponsor(i)}
                    disabled={sponsors.length <= 1}
                    className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-red-600 disabled:opacity-40 disabled:pointer-events-none"
                    aria-label={`Remove sponsor ${i + 1}`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
              {sponsors.length < 2 && (
                <button
                  type="button"
                  onClick={addSponsor}
                  className="text-sm text-sancta-maroon hover:underline"
                >
                  + Add sponsor
                </button>
              )}
            </div>
          </div>
          <div>
            <label htmlFor="officiatingPriest" className="block text-sm font-medium text-gray-700">
              Officiating priest <span className="text-red-500">*</span>
            </label>
            <input
              id="officiatingPriest"
              type="text"
              required
              value={form.officiatingPriest}
              onChange={(e) => setForm((f) => ({ ...f, officiatingPriest: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-sancta-maroon focus:outline-none focus:ring-1 focus:ring-sancta-maroon"
            />
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4">
            <h3 className="text-sm font-medium text-gray-800">Address</h3>
            <p className="mt-0.5 text-xs text-gray-500">e.g. town, area, street (without state)</p>
            <div className="mt-3 space-y-4">
              <div>
                <label htmlFor="parentAddressLine" className="block text-sm font-medium text-gray-700">
                  Address: e.g. town, area, street (without state) <span className="text-red-500">*</span>
                </label>
                <input
                  id="parentAddressLine"
                  type="text"
                  required
                  placeholder="e.g. town, area, street (without state)"
                  value={parentAddressLine}
                  onChange={(e) => setParentAddressLine(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-sancta-maroon focus:outline-none focus:ring-1 focus:ring-sancta-maroon"
                />
              </div>
              <div>
                <label htmlFor="parentAddressState" className="block text-sm font-medium text-gray-700">
                  Select state <span className="text-red-500">*</span>
                </label>
                <select
                  id="parentAddressState"
                  required
                  value={parentAddressState}
                  onChange={(e) => setParentAddressState(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-sancta-maroon focus:outline-none focus:ring-1 focus:ring-sancta-maroon"
                >
                  <option value="">Select state</option>
                  {NIGERIAN_STATES.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          {error && (
            <p role="alert" className="text-red-600 text-sm">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-sancta-maroon px-4 py-3 min-h-[44px] text-white font-medium hover:bg-sancta-maroon-dark disabled:opacity-50 w-full sm:w-auto"
          >
            {submitting ? 'Saving…' : 'Save Baptism'}
          </button>
        </form>
      </div>
    </AuthenticatedLayout>
  );
}
