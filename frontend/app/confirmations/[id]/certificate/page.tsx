'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { fetchConfirmation, fetchBaptism, type ConfirmationResponse, type BaptismResponse } from '@/lib/api';

const BG_CREAM = '#FDF5E6';
const TEXT_MAROON = '#4A0E0E';
const TEXT_BLACK = '#1a1a1a';
const GOLD = '#c9a227';

function formatDisplayDate(isoDate: string): string {
  if (!isoDate) return '';
  const d = new Date(isoDate + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function formatDateIssued(): string {
  return new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function certificateNo(confirmationId: number, parishName: string): string {
  const year = new Date().getFullYear();
  const code = parishName
    .replace(/,/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 4)
    .toUpperCase() || 'CONF';
  return `CONF-${code}-${year}-${String(confirmationId).padStart(6, '0')}`;
}

export default function ConfirmationCertificatePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const isEmbed = searchParams.get('embed') === '1';
  const id = typeof params.id === 'string' ? parseInt(params.id, 10) : NaN;
  const [confirmation, setConfirmation] = useState<ConfirmationResponse | null | undefined>(undefined);
  const [baptism, setBaptism] = useState<BaptismResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);

  useEffect(() => {
    if (Number.isNaN(id)) {
      setConfirmation(null);
      return;
    }
    let cancelled = false;
    fetchConfirmation(id)
      .then((c) => {
        if (!cancelled) setConfirmation(c ?? null);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load');
          setConfirmation(null);
        }
      });
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    if (!confirmation?.baptismId) {
      setBaptism(null);
      return;
    }
    let cancelled = false;
    fetchBaptism(confirmation.baptismId)
      .then((b) => {
        if (!cancelled) setBaptism(b ?? null);
      })
      .catch(() => {
        if (!cancelled) setBaptism(null);
      });
    return () => { cancelled = true; };
  }, [confirmation?.baptismId]);

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
  }, [isEmbed, confirmation, baptism]);

  function handlePrint() {
    window.print();
  }

  if (Number.isNaN(id) || confirmation === null || error) {
    return (
      <div className="min-h-screen bg-white p-8">
        <p className="text-red-600">{error || 'Invalid confirmation or not found.'}</p>
      </div>
    );
  }

  if (confirmation === undefined) {
    return (
      <div className="min-h-screen bg-white p-8">
        <p className="text-gray-600">Loading certificate…</p>
      </div>
    );
  }

  const displayName = baptism
    ? [baptism.baptismName, baptism.otherNames, baptism.surname].filter(Boolean).join(' ').trim()
    : [confirmation.baptismName, confirmation.otherNames, confirmation.surname].filter(Boolean).join(' ').trim();
  const parishName = confirmation.parish ?? baptism?.parishName ?? '—';
  const parishMain = parishName.split(',')[0]?.trim() || parishName;
  const parishCity = parishName.includes(',') ? parishName.split(',').slice(-1)[0]?.trim() || '' : parishName;
  const confirmationDateStr = formatDisplayDate(confirmation.confirmationDate) || '—';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@500;600&display=swap');
        .cert-script { font-family: 'Dancing Script', cursive; }
        .cert-logo-unified {
          filter: sepia(0.45) saturate(0.55) brightness(0.97) contrast(1.05);
        }
        @media print {
          @page { size: A4 landscape; }
          body { background: ${BG_CREAM} !important; }
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
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h4v4H0V0zm8 0h4v4H8V0zm16 0h4v4h-4V0zm24 0h4v4h-4V0zm32 0h4v4h-4V0zm-8 8h4v4h-4V8zm-16 0h4v4h-4V8zm-8 8h4v4H8v-4zm16 0h4v4h-4v-4z' fill='%23e8e0d0' fill-opacity='0.2' fill-rule='evenodd'/%3E%3C/svg%3E")`,
              border: '3px double ' + GOLD,
            }}
          >
            <CornerFiligree position="top-left" />
            <CornerFiligree position="top-right" />
            <CornerFiligree position="bottom-left" />
            <CornerFiligree position="bottom-right" />

            {/* Header: Bishop mitre + crossed croziers logo */}
            <header className="text-center pb-1 relative z-10">
              <div className="mx-auto w-full max-w-2xl cert-logo-unified">
                <Image
                  src="/images/confirmation-header-logo.png"
                  alt=""
                  width={600}
                  height={120}
                  className="w-full h-auto object-contain"
                  unoptimized
                />
              </div>
              <h1 className="mt-3 text-xl font-serif font-bold uppercase tracking-[0.25em] print:text-2xl" style={{ color: TEXT_MAROON }}>
                Certificate of Confirmation
              </h1>
              <p className="mt-2 text-base font-semibold" style={{ color: TEXT_BLACK }}>
                {parishMain}
              </p>
              {parishCity && (
                <p className="mt-0.5 text-sm" style={{ color: TEXT_BLACK, opacity: 0.9 }}>
                  {parishCity}
                </p>
              )}
            </header>

            <DecorativeLine />

            {/* Body: certification text */}
            <div className="py-3 text-center relative z-10 max-w-2xl mx-auto">
              <p className="text-sm" style={{ color: TEXT_BLACK }}>
                This is to certify that
              </p>
              <p className="cert-script mt-1 text-2xl font-semibold print:text-3xl" style={{ color: TEXT_MAROON }}>
                {displayName || '—'}
              </p>
              <p className="mt-1 text-sm" style={{ color: TEXT_BLACK }}>
                has received the Sacrament of Confirmation on{' '}
                <strong>{confirmationDateStr}</strong>
                {parishName && <> at <strong>{parishName}</strong></>}.
              </p>
            </div>

            <DecorativeLine />

            {/* Footer: Seal (left) | Signature (center) | Illustration + Metadata (right) */}
            <footer className="mt-2 pt-3 relative z-10">
              <div className="flex flex-wrap items-end justify-between gap-6">
                {/* Left: Church seal - circular wax seal style */}
                <div className="flex flex-col items-center shrink-0">
                  <div className="relative w-24 h-24 rounded-full overflow-hidden" style={{ border: '2px solid ' + GOLD, backgroundColor: BG_CREAM }}>
                    <SealSunburst />
                    <div className="absolute inset-2 rounded-full overflow-hidden flex items-center justify-center cert-logo-unified" style={{ backgroundColor: BG_CREAM }}>
                      <Image
                        src="/images/holy-family-church-logo.png"
                        alt=""
                        width={64}
                        height={64}
                        className="object-contain w-14 h-14"
                        unoptimized
                      />
                    </div>
                  </div>
                  <p className="mt-1.5 text-[8px] font-bold uppercase text-center leading-tight max-w-[100px] tracking-wide" style={{ color: TEXT_MAROON }}>
                    {parishMain.replace(/,/g, ' ').toUpperCase()}
                  </p>
                  {parishCity && (
                    <p className="text-[7px] font-bold uppercase tracking-wider" style={{ color: TEXT_MAROON }}>
                      {parishCity.toUpperCase()}
                    </p>
                  )}
                </div>

                {/* Center: Signature section */}
                <div className="flex-1 min-w-[200px] text-center">
                  <p className="cert-script text-base italic" style={{ color: TEXT_BLACK }}>{confirmation.officiatingBishop || '—'}</p>
                  <div className="h-5 border-b mx-auto max-w-[160px] mt-0.5" style={{ borderColor: TEXT_BLACK }} />
                  <p className="mt-1.5 text-sm font-bold" style={{ color: TEXT_BLACK }}>{confirmation.officiatingBishop || '—'}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: TEXT_BLACK, opacity: 0.9 }}>Officiating Bishop</p>
                  <p className="mt-1.5 text-xs font-medium" style={{ color: TEXT_BLACK }}>{parishName}</p>
                  <p className="mt-1 text-[10px] italic" style={{ color: TEXT_BLACK, opacity: 0.8 }}>This certificate is issued for official use.</p>
                </div>

                {/* Right: Illustration + Metadata side by side */}
                <div className="flex items-end gap-4 shrink-0">
                  <div className="w-24 h-32 relative shrink-0 cert-logo-unified" aria-hidden>
                    <Image
                      src="/images/confirmation-right-illustration.png"
                      alt=""
                      fill
                      className="object-contain object-bottom"
                      unoptimized
                    />
                  </div>
                  <div className="text-right text-xs space-y-0.5 pb-1" style={{ color: TEXT_BLACK }}>
                    <p><span className="font-medium">Date Issued:</span> {formatDateIssued()}</p>
                    <p><span className="font-medium">Certificate No:</span> {certificateNo(confirmation.id ?? 0, parishName)}</p>
                    <p><span className="font-medium">Register:</span> Confirmation Register – Book —</p>
                    <p><span className="font-medium">Page:</span> —</p>
                    <p><span className="font-medium">Entry:</span> —</p>
                  </div>
                </div>
              </div>
            </footer>
          </article>
        </div>
      </div>
    </>
  );
}

function SealSunburst() {
  const rays = 24;
  return (
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
      {Array.from({ length: rays }, (_, i) => {
        const a = (i * (360 / rays)) * Math.PI / 180;
        const x1 = 50 + 38 * Math.cos(a);
        const y1 = 50 + 38 * Math.sin(a);
        const x2 = 50 + 50 * Math.cos(a);
        const y2 = 50 + 50 * Math.sin(a);
        return (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={GOLD} strokeWidth="1.5" strokeLinecap="round" />
        );
      })}
    </svg>
  );
}

function CornerFiligree({ position }: { position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' }) {
  const base = 'absolute w-24 h-24 pointer-events-none';
  const pos = {
    'top-left': 'top-2 left-2',
    'top-right': 'top-2 right-2 scale-x-[-1]',
    'bottom-left': 'bottom-2 left-2 scale-y-[-1]',
    'bottom-right': 'bottom-2 right-2 scale-x-[-1] scale-y-[-1]',
  }[position];
  return (
    <div className={`${base} ${pos}`} style={{ color: GOLD }} aria-hidden>
      <svg viewBox="0 0 96 96" fill="none" stroke="currentColor" strokeWidth="1" className="w-full h-full opacity-80">
        <path d="M0 0 L48 0 M0 0 L0 48" strokeWidth="1.5" />
        <path d="M4 4 L44 4 M4 4 L4 44" strokeWidth="1" />
        <path d="M8 8 Q28 8 44 8 M8 8 Q8 28 8 44" strokeWidth="0.8" strokeLinecap="round" />
        <path d="M12 12 Q24 12 36 12 M12 12 Q12 24 12 36" strokeWidth="0.6" strokeLinecap="round" />
        <path d="M16 16 Q22 16 28 16 M16 16 Q16 22 16 28" strokeWidth="0.5" strokeLinecap="round" />
        <path d="M20 20 Q24 20 28 20 M20 20 Q20 24 20 28" strokeWidth="0.4" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function DecorativeLine() {
  return (
    <div className="flex items-center justify-center gap-2 py-1" aria-hidden>
      <span className="flex-1 h-px max-w-[140px]" style={{ backgroundColor: GOLD, opacity: 0.9 }} />
      <span className="text-xs" style={{ color: GOLD }}>✦</span>
      <span className="flex-1 h-px max-w-[140px]" style={{ backgroundColor: GOLD, opacity: 0.9 }} />
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
