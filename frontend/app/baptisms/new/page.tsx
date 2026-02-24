'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { createBaptism, type BaptismRequest } from '@/lib/api';
import { NIGERIAN_STATES } from '@/lib/nigerian-states';

export default function BaptismCreatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const parishIdParam = searchParams.get('parishId');
  const parishId = parishIdParam ? parseInt(parishIdParam, 10) : null;

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<BaptismRequest>({
    baptismName: '',
    otherNames: '',
    surname: '',
    gender: 'MALE',
    dateOfBirth: '',
    fathersName: '',
    mothersName: '',
    sponsorNames: '',
    officiatingPriest: '',
  });
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const line = parentAddressLine.trim();
      const state = parentAddressState.trim();
      const parentAddress = state ? (line ? `${line}, ${state}` : state) : undefined;
      await createBaptism(parishId as number, { ...form, parentAddress });
      router.push('/baptisms');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create baptism');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthenticatedLayout>
      <div className="mb-4">
        <Link href="/baptisms" className="text-sancta-maroon hover:underline">
          ← Back to baptisms
        </Link>
      </div>
      <h1 className="text-2xl font-serif font-semibold text-sancta-maroon">New baptism</h1>
      <form onSubmit={handleSubmit} className="mt-6 max-w-xl space-y-4">
        <div>
          <label htmlFor="baptismName" className="block text-sm font-medium text-gray-700">
            Baptism name
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
        <div>
          <label htmlFor="otherNames" className="block text-sm font-medium text-gray-700">
            Other names
          </label>
          <input
            id="otherNames"
            type="text"
            value={form.otherNames}
            onChange={(e) => setForm((f) => ({ ...f, otherNames: e.target.value }))}
            placeholder="Optional"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-sancta-maroon focus:outline-none focus:ring-1 focus:ring-sancta-maroon"
          />
        </div>
        <div>
          <label htmlFor="surname" className="block text-sm font-medium text-gray-700">
            Surname
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
            Date of birth
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
            Father&apos;s name
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
            Mother&apos;s name
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
          <label htmlFor="sponsorNames" className="block text-sm font-medium text-gray-700">
            Sponsor names
          </label>
          <input
            id="sponsorNames"
            type="text"
            required
            value={form.sponsorNames}
            onChange={(e) => setForm((f) => ({ ...f, sponsorNames: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-sancta-maroon focus:outline-none focus:ring-1 focus:ring-sancta-maroon"
          />
        </div>
        <div>
          <label htmlFor="officiatingPriest" className="block text-sm font-medium text-gray-700">
            Officiating priest
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
          <h3 className="text-sm font-medium text-gray-800">Parents&apos; address</h3>
          <p className="mt-1 text-xs text-gray-500">Address without state, then select state (Nigeria)</p>
          <div className="mt-3 space-y-4">
            <div>
              <label htmlFor="parentAddressLine" className="block text-sm font-medium text-gray-700">
                Address line
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
                State (Nigeria)
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
          className="rounded-lg bg-sancta-maroon px-4 py-2 text-white font-medium hover:bg-sancta-maroon-dark disabled:opacity-50"
        >
          {submitting ? 'Saving…' : 'Save baptism'}
        </button>
      </form>
    </AuthenticatedLayout>
  );
}
