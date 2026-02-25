'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { fetchBaptismCertificateData, type BaptismCertificateData } from '@/lib/api';

function formatDisplayDate(isoDate: string): string {
  if (!isoDate) return '';
  const d = new Date(isoDate + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export default function BaptismCertificatePage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? parseInt(params.id, 10) : NaN;
  const [data, setData] = useState<BaptismCertificateData | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (Number.isNaN(id)) {
      setData(null);
      return;
    }
    let cancelled = false;
    fetchBaptismCertificateData(id)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load');
          setData(null);
        }
      });
    return () => { cancelled = true; };
  }, [id]);

  function handlePrint() {
    window.print();
  }

  if (Number.isNaN(id) || data === null || error) {
    return (
      <div className="min-h-screen bg-white p-8">
        <p className="text-red-600">{error || 'Invalid baptism or not found.'}</p>
      </div>
    );
  }

  if (data === undefined) {
    return (
      <div className="min-h-screen bg-white p-8">
        <p className="text-gray-600">Loading certificate…</p>
      </div>
    );
  }

  const { baptism, parishName, dioceseName } = data;
  const displayName = `${baptism.baptismName}${baptism.otherNames ? ` ${baptism.otherNames}` : ''} ${baptism.surname}`.trim();

  return (
    <>
      <div className="hidden print:block" aria-hidden>
        {/* Print-only: certificate template */}
      </div>
      <div className="min-h-screen bg-white p-8 print:p-12">
        <div className="mx-auto max-w-2xl print:max-w-none">
          {/* Screen: print button */}
          <div className="mb-8 flex justify-end print:hidden">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-lg bg-sancta-maroon px-4 py-2 font-medium text-white hover:bg-sancta-maroon-dark"
            >
              <PrinterIcon className="h-5 w-5" />
              Print / Save as PDF
            </button>
          </div>

          {/* Certificate template */}
          <article className="rounded-lg border-2 border-gray-200 p-8 print:border-sancta-maroon print:p-12" style={{ minHeight: '60vh' }}>
            <header className="border-b border-gray-200 pb-6 text-center print:border-sancta-maroon">
              <h1 className="text-xl font-serif font-semibold text-sancta-maroon print:text-2xl">
                Baptism Certificate
              </h1>
              <p className="mt-2 text-lg font-medium text-gray-800">
                {parishName}
                {parishName && dioceseName ? ' · ' : ''}
                {dioceseName}
              </p>
            </header>

            <div className="mt-8 space-y-4">
              <p className="text-gray-700">
                This is to certify that <strong className="text-gray-900">{displayName}</strong> was
                received into the Church through the Sacrament of Baptism.
              </p>
              <dl className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-[auto_1fr]">
                <dt className="font-medium text-gray-600">Date of birth:</dt>
                <dd>{formatDisplayDate(baptism.dateOfBirth)}</dd>
                <dt className="font-medium text-gray-600">Gender:</dt>
                <dd>{baptism.gender}</dd>
                <dt className="font-medium text-gray-600">Father:</dt>
                <dd>{baptism.fathersName}</dd>
                <dt className="font-medium text-gray-600">Mother:</dt>
                <dd>{baptism.mothersName}</dd>
                <dt className="font-medium text-gray-600">Sponsors:</dt>
                <dd>{baptism.sponsorNames}</dd>
                {baptism.officiatingPriest && (
                  <>
                    <dt className="font-medium text-gray-600">Officiating priest:</dt>
                    <dd>{baptism.officiatingPriest}</dd>
                  </>
                )}
                {(baptism.parentAddress ?? baptism.address) && (
                  <>
                    <dt className="font-medium text-gray-600">Parents&apos; address:</dt>
                    <dd>{baptism.parentAddress ?? baptism.address}</dd>
                  </>
                )}
              </dl>
            </div>

            <footer className="mt-12 pt-6 text-center text-sm text-gray-500 print:mt-16">
              <p>{parishName}</p>
              <p>{dioceseName}</p>
              <p className="mt-2">This certificate is issued for official use.</p>
            </footer>
          </article>
        </div>
      </div>
    </>
  );
}

function PrinterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
    </svg>
  );
}
