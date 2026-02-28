'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { fetchCommunion, type FirstHolyCommunionResponse } from '@/lib/api';

function formatDisplayDate(isoDate: string): string {
  if (!isoDate) return '';
  const d = new Date(isoDate + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export default function CommunionCertificatePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const isEmbed = searchParams.get('embed') === '1';
  const id = typeof params.id === 'string' ? parseInt(params.id, 10) : NaN;
  const [data, setData] = useState<FirstHolyCommunionResponse | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);

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
  }, [isEmbed, data]);

  useEffect(() => {
    if (Number.isNaN(id)) {
      setData(null);
      return;
    }
    let cancelled = false;
    fetchCommunion(id)
      .then((c) => {
        if (!cancelled) setData(c ?? null);
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
        <p className="text-red-600">{error || 'Invalid communion or not found.'}</p>
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

  const displayName = [data.baptismName, data.otherNames, data.surname].filter(Boolean).join(' ').trim() || '—';

  return (
    <>
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

          <article className={`rounded-lg border-2 border-gray-200 print:border-sancta-maroon print:p-12 ${isEmbed ? 'p-4' : 'p-8'}`} style={isEmbed ? { minHeight: 'auto' } : { minHeight: '50vh' }}>
            <header className="border-b border-gray-200 pb-6 text-center print:border-sancta-maroon">
              <h1 className="text-xl font-serif font-semibold text-sancta-maroon print:text-2xl">
                Certificate of First Holy Communion
              </h1>
              <p className="mt-2 text-lg font-medium text-gray-800">
                {data.parish}
              </p>
            </header>

            <div className="mt-8 space-y-4">
              <p className="text-gray-700">
                This is to certify that <strong className="text-gray-900">{displayName}</strong> has
                received the Sacrament of First Holy Communion on{' '}
                <strong>{formatDisplayDate(data.communionDate)}</strong> at {data.parish}.
              </p>
              <p className="text-gray-600 text-sm">
                Officiating priest: {data.officiatingPriest}
              </p>
            </div>

            <footer className="mt-12 pt-6 text-center text-sm text-gray-500 print:mt-16">
              <p>{data.parish}</p>
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
