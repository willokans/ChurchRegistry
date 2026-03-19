'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { fetchCommunion, type FirstHolyCommunionResponse } from '@/lib/api';

const BG_CREAM = '#FDF5E6';
const TEXT_MAROON = '#4A0E0E';
const GOLD = '#b8860b';

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
  const parishMain = parishName.split(',')[0]?.trim() || parishName;
  const parishLocation = parishName.includes(',') ? parishName.split(',').slice(1).join(',').trim() : '';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@500;600&display=swap');
        .cert-script { font-family: 'Dancing Script', cursive; }
        @media print {
          @page { size: A4 landscape; }
          body { background: #FDF5E6 !important; }
        }
      `}</style>
      <div
        ref={isEmbed ? containerRef : undefined}
        className={`${isEmbed ? 'fixed inset-0 flex items-center justify-center overflow-hidden' : 'min-h-screen p-8'}`}
        style={{ backgroundColor: BG_CREAM }}
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
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2 font-medium text-white"
                style={{ backgroundColor: TEXT_MAROON }}
              >
                <PrinterIcon className="h-5 w-5" />
                Print / Save as PDF
              </button>
            </div>
          )}

          <article
            className="relative overflow-hidden rounded-sm p-10 shadow-lg print:shadow-none"
            style={{
              backgroundColor: BG_CREAM,
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h2v2H0V0zm4 0h2v2H4V0z' fill='%23e8e0d0' fill-opacity='0.25' fill-rule='evenodd'/%3E%3C/svg%3E")`,
              border: '3px double #c9a227',
            }}
          >
            <CornerFiligree position="top-left" />
            <CornerFiligree position="top-right" />
            <CornerFiligree position="bottom-left" />
            <CornerFiligree position="bottom-right" />

            {/* Chalice illustration - top left */}
            <div className="absolute top-6 left-6 w-28 h-36" aria-hidden>
              <ChaliceIllustration />
            </div>
            {/* Chalice illustration - bottom right (mirrored) */}
            <div className="absolute bottom-6 right-6 w-24 h-32 scale-x-[-1] scale-y-[-1]" aria-hidden>
              <ChaliceIllustration />
            </div>

            {/* Header: cross, CERTIFICATE flanked by lines, OF FIRST HOLY COMMUNION */}
            <header className="text-center pb-2 relative z-10">
              <CrossIcon className="mx-auto h-6 w-6" style={{ color: GOLD }} />
              <div className="mt-4 flex items-center justify-center gap-3">
                <span className="flex-1 max-w-[80px] h-px" style={{ backgroundColor: GOLD }} />
                <p className="text-sm font-serif font-bold uppercase tracking-[0.2em]" style={{ color: TEXT_MAROON }}>
                  Certificate
                </p>
                <span className="flex-1 max-w-[80px] h-px" style={{ backgroundColor: GOLD }} />
              </div>
              <h1 className="mt-1 text-lg font-serif font-bold uppercase tracking-wider print:text-xl" style={{ color: TEXT_MAROON }}>
                Of First Holy Communion
              </h1>
            </header>

            <DecorativeLine />

            {/* Body: certification text */}
            <div className="py-8 text-center relative z-10 max-w-2xl mx-auto">
              <p className="text-sm font-sans" style={{ color: TEXT_MAROON }}>
                This is to certify that
              </p>
              <p className="cert-script mt-2 text-2xl font-semibold print:text-3xl" style={{ color: TEXT_MAROON }}>
                {displayName}
              </p>
              <p className="mt-2 text-sm font-sans" style={{ color: TEXT_MAROON }}>
                has received the Sacrament of First Holy Communion on{' '}
                <strong>{communionDateStr}</strong>
                {parishName && <> at <strong>{parishName}</strong></>}.
              </p>
            </div>

            <DecorativeLine />

            {/* Footer: Seal (left) | Signature (center) | Metadata (right) */}
            <footer className="mt-8 pt-6 relative z-10">
              <div className="flex flex-wrap items-end justify-between gap-8">
                {/* Left: Church seal - circular with church building */}
                <div className="flex flex-col items-center shrink-0">
                  <div
                    className="h-24 w-24 rounded-full flex items-center justify-center overflow-hidden shadow-inner"
                    style={{ border: '2px solid #c9a227', backgroundColor: 'rgba(255,255,255,0.9)' }}
                  >
                    <Image
                      src="/images/holy-family-church-logo.png"
                      alt=""
                      width={80}
                      height={80}
                      className="object-contain w-16 h-16"
                      unoptimized
                    />
                  </div>
                  <p className="mt-2 text-[9px] font-bold uppercase text-center leading-tight max-w-[110px]" style={{ color: TEXT_MAROON }}>
                    {parishMain}
                  </p>
                  {parishLocation && (
                    <p className="text-[8px] font-medium uppercase text-center" style={{ color: TEXT_MAROON, opacity: 0.9 }}>
                      {parishLocation}
                    </p>
                  )}
                </div>

                {/* Center: Signature section */}
                <div className="flex-1 min-w-[220px] text-center">
                  <p className="cert-script text-lg italic" style={{ color: TEXT_MAROON }}>{data.officiatingPriest || '—'}</p>
                  <div className="h-6 border-b mx-auto max-w-[160px] mt-1" style={{ borderColor: TEXT_MAROON }} />
                  <p className="mt-2 text-sm font-bold" style={{ color: TEXT_MAROON }}>{data.officiatingPriest || '—'}</p>
                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color: TEXT_MAROON, opacity: 0.85 }}>Officiating Priest</p>
                  <p className="mt-2 text-sm font-medium" style={{ color: TEXT_MAROON }}>{parishName}</p>
                  <p className="mt-1 text-xs italic" style={{ color: TEXT_MAROON, opacity: 0.8 }}>This certificate is issued for official use.</p>
                </div>

                {/* Right: Administrative details */}
                <div className="text-right shrink-0 text-sm space-y-0.5" style={{ color: TEXT_MAROON }}>
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
  const base = 'absolute w-20 h-20 pointer-events-none';
  const pos = {
    'top-left': 'top-2 left-2',
    'top-right': 'top-2 right-2 scale-x-[-1]',
    'bottom-left': 'bottom-2 left-2 scale-y-[-1]',
    'bottom-right': 'bottom-2 right-2 scale-x-[-1] scale-y-[-1]',
  }[position];
  return (
    <div className={`${base} ${pos}`} style={{ color: GOLD }} aria-hidden>
      <svg viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="1" className="w-full h-full opacity-75">
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
      <span className="flex-1 h-px max-w-[120px]" style={{ backgroundColor: GOLD, opacity: 0.8 }} />
      <span className="text-xs" style={{ color: GOLD }}>◆</span>
      <span className="flex-1 h-px max-w-[120px]" style={{ backgroundColor: GOLD, opacity: 0.8 }} />
    </div>
  );
}

function ChaliceIllustration() {
  return (
    <svg viewBox="0 0 120 140" fill="none" stroke="#c9a227" strokeWidth="1" className="w-full h-full">
      <path d="M60 12 L60 58 L44 98 L76 98 L60 58 Z" fill="none" strokeWidth="1.5" />
      <ellipse cx="60" cy="12" rx="18" ry="6" fill="none" strokeWidth="1.5" />
      <circle cx="60" cy="9" r="6" fill="white" fillOpacity="0.95" stroke="#c9a227" strokeWidth="0.8" />
      <path d="M60 5 v8 M56 9 h8" stroke="#c9a227" strokeWidth="0.6" />
      <ellipse cx="60" cy="105" rx="12" ry="4" fill="none" strokeWidth="1" />
      <path d="M30 75 Q34 55 38 38" strokeWidth="0.8" strokeLinecap="round" />
      <path d="M90 75 Q86 55 82 38" strokeWidth="0.8" strokeLinecap="round" />
      <ellipse cx="24" cy="82" rx="8" ry="9" fill="#6b2d6b" fillOpacity="0.6" stroke="#c9a227" strokeWidth="0.5" />
      <ellipse cx="96" cy="82" rx="8" ry="9" fill="#6b2d6b" fillOpacity="0.6" stroke="#c9a227" strokeWidth="0.5" />
      <path d="M18 70 Q22 65 26 68" strokeWidth="0.5" stroke="#2d5016" />
      <path d="M94 70 Q90 65 86 68" strokeWidth="0.5" stroke="#2d5016" />
      <rect x="56" y="25" width="8" height="38" rx="1" fill="white" fillOpacity="0.95" stroke="#c9a227" strokeWidth="0.5" />
      <path d="M56 25 L60 20 L64 25 Z" fill="#fef3c7" stroke="#c9a227" strokeWidth="0.5" />
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
