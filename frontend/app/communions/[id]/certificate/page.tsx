'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { fetchCommunion, type FirstHolyCommunionResponse } from '@/lib/api';

function formatDisplayDate(isoDate: string): string {
  if (!isoDate) return '';
  const d = new Date(isoDate + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function formatDateIssued(): string {
  return new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function certificateNo(communionId: number, parishName: string): string {
  const year = new Date().getFullYear();
  const code = parishName.replace(/\s+/g, '').slice(0, 4).toUpperCase() || 'PR';
  return `FHC-${code}-${year} ${String(communionId).padStart(5, '0')}`;
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
  const parishName = data.parish || '';
  const communionDateStr = formatDisplayDate(data.communionDate) || '—';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@500;600&display=swap');
        .cert-script { font-family: 'Dancing Script', cursive; }
        @media print {
          @page { size: A4 landscape; }
        }
      `}</style>
      <div
        ref={isEmbed ? containerRef : undefined}
        className={`print:bg-[#faf8f3] ${isEmbed ? 'fixed inset-0 flex items-center justify-center overflow-hidden bg-[#faf8f3]' : 'min-h-screen p-8 bg-[#faf8f3]'}`}
      >
        <div
          ref={isEmbed ? contentRef : undefined}
          className="mx-auto max-w-4xl print:max-w-none shrink-0"
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

          <article
            className="relative overflow-hidden rounded-sm bg-[#faf8f3] p-10 shadow-lg print:shadow-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h2v2H0V0zm4 0h2v2H4V0z' fill='%23e8e0d0' fill-opacity='0.35' fill-rule='evenodd'/%3E%3C/svg%3E")`,
              border: '3px double #b8860b',
            }}
          >
            <CornerFiligree position="top-left" />
            <CornerFiligree position="top-right" />
            <CornerFiligree position="bottom-left" />
            <CornerFiligree position="bottom-right" />

            {/* Chalice illustration - top left */}
            <div className="absolute top-4 left-4 w-24 h-28 text-sancta-gold opacity-80" aria-hidden>
              <ChaliceIllustration />
            </div>
            {/* Chalice illustration - bottom right (mirrored) */}
            <div className="absolute bottom-4 right-4 w-24 h-28 text-sancta-gold opacity-80 scale-x-[-1] scale-y-[-1]" aria-hidden>
              <ChaliceIllustration />
            </div>

            {/* Header */}
            <header className="text-center pb-2 relative z-10">
              <CrossIcon className="mx-auto h-8 w-8 text-sancta-gold" />
              <p className="mt-3 text-sm font-serif text-sancta-maroon tracking-widest">— CERTIFICATE —</p>
              <h1 className="mt-1 text-xl font-serif font-bold uppercase tracking-wider text-sancta-maroon print:text-2xl">
                Of First Holy Communion
              </h1>
            </header>

            <DecorativeLine />

            {/* Body: certification text with date and location inline */}
            <div className="py-8 text-center relative z-10 max-w-2xl mx-auto">
              <p className="text-gray-700">
                This is to certify that{' '}
                <span className="cert-script text-xl font-semibold text-gray-900 print:text-2xl">{displayName}</span>
                {' '}has received the Sacrament of First Holy Communion on{' '}
                <strong className="text-gray-900">{communionDateStr}</strong>
                {parishName && <> at <strong className="text-gray-900">{parishName}</strong></>}.
              </p>
            </div>

            <DecorativeLine />

            {/* Footer: Seal (left) | Signature (center) | Metadata (right) */}
            <footer className="mt-10 pt-6 relative z-10">
              <div className="flex flex-wrap items-end justify-between gap-6">
                {/* Left: Church seal */}
                <div className="flex flex-col items-center shrink-0">
                  <div className="h-20 w-20 rounded-full border-2 border-sancta-gold flex items-center justify-center overflow-hidden bg-white/90 shadow-inner">
                    <Image
                      src="/images/holy-family-church-logo.png"
                      alt=""
                      width={64}
                      height={64}
                      className="object-contain w-14 h-14"
                      unoptimized
                    />
                  </div>
                  <p className="mt-2 text-[9px] font-bold uppercase text-center text-gray-700 leading-tight max-w-[100px]">
                    {parishName.split(',')[0]?.trim() || parishName}
                  </p>
                  {parishName.includes(',') && (
                    <p className="text-[8px] font-medium uppercase text-center text-gray-600">
                      {parishName.split(',').slice(1).join(',').trim()}
                    </p>
                  )}
                </div>

                {/* Center: Signature */}
                <div className="flex-1 min-w-[200px] text-center">
                  <p className="cert-script text-base text-gray-800 italic">{data.officiatingPriest || '—'}</p>
                  <div className="h-8 border-b border-gray-600 mx-auto max-w-[180px] mt-0.5" />
                  <p className="mt-2 text-sm font-bold text-gray-900">{data.officiatingPriest || '—'}</p>
                  <p className="text-xs font-bold uppercase text-gray-600">Officiating Priest</p>
                  <p className="mt-2 text-sm font-medium text-gray-800">{parishName}</p>
                  <p className="mt-1 text-xs italic text-gray-600">This certificate is issued for official use.</p>
                </div>

                {/* Right: Metadata */}
                <div className="text-right shrink-0 text-sm text-gray-700 space-y-0.5">
                  <p><span className="font-medium">Date Issued:</span> {formatDateIssued()}</p>
                  <p><span className="font-medium">Certificate No:</span> {certificateNo(data.id, parishName)}</p>
                  <p><span className="font-medium">Register:</span> Communion Register — Book —</p>
                  <p><span className="font-medium">Page:</span> —</p>
                  <p><span className="font-medium">Entry:</span> —</p>
                </div>
              </div>
            </footer>
          </article>
        </div>
      </div>
    </>
  );
}

function CornerFiligree({ position }: { position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' }) {
  const base = 'absolute w-20 h-20 text-sancta-gold pointer-events-none';
  const pos = {
    'top-left': 'top-2 left-2',
    'top-right': 'top-2 right-2 scale-x-[-1]',
    'bottom-left': 'bottom-2 left-2 scale-y-[-1]',
    'bottom-right': 'bottom-2 right-2 scale-x-[-1] scale-y-[-1]',
  }[position];
  return (
    <div className={`${base} ${pos}`} aria-hidden>
      <svg viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="1" className="w-full h-full opacity-70">
        <path d="M0 0 L40 0 M0 0 L0 40" strokeWidth="1.2" />
        <path d="M4 4 L36 4 M4 4 L4 36" strokeWidth="0.8" />
        <path d="M8 8 Q24 8 36 8 M8 8 Q8 24 8 36" strokeWidth="0.6" strokeLinecap="round" />
        <path d="M12 12 Q20 12 28 12 M12 12 Q12 20 12 28" strokeWidth="0.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function DecorativeLine() {
  return (
    <div className="flex items-center justify-center gap-2 py-2" aria-hidden>
      <span className="flex-1 h-px bg-sancta-gold/70" />
      <span className="text-sancta-gold/80 text-xs">◆</span>
      <span className="flex-1 h-px bg-sancta-gold/70" />
    </div>
  );
}

function ChaliceIllustration() {
  return (
    <svg viewBox="0 0 100 120" fill="none" stroke="currentColor" strokeWidth="1" className="w-full h-full">
      <path d="M50 10 L50 52 L36 88 L64 88 L50 52 Z" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <ellipse cx="50" cy="10" rx="14" ry="5" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="50" cy="8" r="4" fill="white" fillOpacity="0.95" stroke="currentColor" strokeWidth="0.6" />
      <path d="M50 5.5 v5 M47.5 8 h5" stroke="currentColor" strokeWidth="0.5" />
      <ellipse cx="50" cy="92" rx="9" ry="3" fill="none" stroke="currentColor" strokeWidth="0.8" />
      <path d="M28 65 Q30 45 32 28" strokeWidth="0.6" strokeLinecap="round" />
      <path d="M72 65 Q70 45 68 28" strokeWidth="0.6" strokeLinecap="round" />
      <circle cx="24" cy="72" r="6" fill="#6b2d6b" fillOpacity="0.5" stroke="currentColor" strokeWidth="0.5" />
      <circle cx="76" cy="72" r="6" fill="#6b2d6b" fillOpacity="0.5" stroke="currentColor" strokeWidth="0.5" />
      <rect x="47" y="22" width="6" height="32" rx="1" fill="white" fillOpacity="0.9" stroke="currentColor" strokeWidth="0.5" />
      <path d="M47 22 L50 18 L53 22 Z" fill="#fef3c7" stroke="currentColor" strokeWidth="0.5" />
    </svg>
  );
}

function CrossIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 2v20M2 12h20" />
    </svg>
  );
}

function PrinterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
    </svg>
  );
}
