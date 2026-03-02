'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { fetchMarriage, type MarriageResponse } from '@/lib/api';

function formatDisplayDate(isoDate: string): string {
  if (!isoDate) return '';
  const d = new Date(isoDate + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function formatTime(isoTime: string | null | undefined): string {
  if (!isoTime) return '';
  const [h, m] = isoTime.split(':');
  const hour = parseInt(h ?? '0', 10);
  const min = m ?? '00';
  const am = hour < 12;
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${h12}:${min} ${am ? 'AM' : 'PM'}`;
}

export default function MarriageCertificatePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const isEmbed = searchParams.get('embed') === '1';
  const id = typeof params.id === 'string' ? parseInt(params.id, 10) : NaN;
  const [marriage, setMarriage] = useState<MarriageResponse | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);

  useEffect(() => {
    if (Number.isNaN(id)) {
      setMarriage(null);
      return;
    }
    let cancelled = false;
    fetchMarriage(id)
      .then((m) => {
        if (!cancelled) setMarriage(m ?? null);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load');
          setMarriage(null);
        }
      });
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    if (!isEmbed || !containerRef.current || !contentRef.current) return;
    const container = containerRef.current;
    const content = contentRef.current;
    const updateScale = () => {
      const cw = container.clientWidth;
      const ch = container.clientHeight;
      const w = content.scrollWidth;
      const h = content.scrollHeight;
      if (cw <= 0 || ch <= 0 || w <= 0 || h <= 0) return;
      const s = Math.min(cw / w, ch / h, 1);
      if (s > 0.05) setScale(s);
    };
    const t = setTimeout(() => requestAnimationFrame(updateScale), 50);
    const ro = new ResizeObserver(() => requestAnimationFrame(updateScale));
    ro.observe(container);
    return () => {
      clearTimeout(t);
      ro.disconnect();
    };
  }, [isEmbed, marriage]);

  function handlePrint() {
    window.print();
  }

  if (Number.isNaN(id) || marriage === null || error) {
    return (
      <div className="min-h-screen bg-white p-8">
        <p className="text-red-600">{error || 'Invalid marriage or not found.'}</p>
      </div>
    );
  }

  if (marriage === undefined) {
    return (
      <div className="min-h-screen bg-white p-8">
        <p className="text-gray-600">Loading certificate…</p>
      </div>
    );
  }

  const groom = marriage.parties?.find((p) => String(p.role).toUpperCase() === 'GROOM');
  const bride = marriage.parties?.find((p) => String(p.role).toUpperCase() === 'BRIDE');
  const partnerNames =
    groom?.fullName && bride?.fullName ? `${groom.fullName} & ${bride.fullName}` : marriage.partnersName;
  const witnessNames = marriage.witnesses?.map((w) => w.fullName).filter(Boolean).join(', ') || '—';

  return (
    <div
      ref={isEmbed ? containerRef : undefined}
      className={`bg-white print:p-12 ${isEmbed ? 'fixed inset-0 flex items-center justify-center overflow-hidden' : 'min-h-screen p-8'}`}
    >
      <div
        ref={isEmbed ? contentRef : undefined}
        className="mx-auto max-w-2xl print:max-w-none shrink-0"
        style={isEmbed ? { transform: `scale(${scale})`, transformOrigin: 'center center' } : undefined}
      >
        {!isEmbed && (
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
        )}

        <article className={`rounded-lg border-2 border-gray-200 print:border-sancta-maroon print:p-12 ${isEmbed ? 'p-4' : 'p-8'}`}>
          <header className="border-b border-gray-200 pb-6 text-center print:border-sancta-maroon">
            <h1 className="text-xl font-serif font-semibold text-sancta-maroon print:text-2xl">
              Civil Marriage Certificate
            </h1>
            <p className="mt-2 text-lg font-medium text-gray-800">
              {marriage.churchName || marriage.parish}
            </p>
          </header>

          <div className="mt-8 space-y-4">
            <p className="text-gray-700">
              This certifies that <strong className="text-gray-900">{partnerNames || '—'}</strong> were
              joined in Holy Matrimony on <strong>{formatDisplayDate(marriage.marriageDate)}</strong>
              {marriage.marriageTime ? ` at ${formatTime(marriage.marriageTime)}` : ''} in{' '}
              <strong>{marriage.parish}</strong>.
            </p>

            <dl className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-[auto_1fr]">
              <dt className="font-medium text-gray-600">Officiating priest:</dt>
              <dd>{marriage.officiatingPriest}</dd>
              <dt className="font-medium text-gray-600">Witnesses:</dt>
              <dd>{witnessNames}</dd>
              {marriage.civilRegistryNumber && (
                <>
                  <dt className="font-medium text-gray-600">Civil registry number:</dt>
                  <dd>{marriage.civilRegistryNumber}</dd>
                </>
              )}
              {marriage.marriageRegister && (
                <>
                  <dt className="font-medium text-gray-600">Marriage register:</dt>
                  <dd>{marriage.marriageRegister}</dd>
                </>
              )}
            </dl>
          </div>
        </article>
      </div>
    </div>
  );
}

function PrinterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
    </svg>
  );
}
