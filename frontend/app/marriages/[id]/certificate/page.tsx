'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { fetchMarriage, type MarriageResponse } from '@/lib/api';

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

function formatOrDash(isoDate?: string | null): string {
  if (!isoDate) return '—';
  return formatDisplayDate(isoDate) || '—';
}

function formatDateIssued(): string {
  return new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function certificateNo(marriageId: number, churchNameOrParish: string): string {
  const year = new Date().getFullYear();
  const code =
    churchNameOrParish
      .replace(/,/g, ' ')
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w[0])
      .join('')
      .slice(0, 3)
      .toUpperCase() || 'MAR';
  return `MAR-${code}-${year}-${String(marriageId).padStart(7, '0')}`;
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
  const churchSubtitle = marriage.churchName || marriage.parish || '—';
  const groomFullName = groom?.fullName || marriage.groomName || '—';
  const brideFullName = bride?.fullName || marriage.brideName || '—';
  const marriageDateStr = formatOrDash(marriage.marriageDate);
  const groomDobStr = formatOrDash(groom?.dateOfBirth);
  const brideDobStr = formatOrDash(bride?.dateOfBirth);
  const groomBaptisedAt = groom?.baptismChurch || '—';
  const brideBaptisedAt = bride?.baptismChurch || '—';
  const groomConfirmation = groom?.confirmationId ? 'Yes' : '—';
  const brideConfirmation = bride?.confirmationId ? 'Yes' : '—';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@500;600&display=swap');
        .cert-script { font-family: 'Dancing Script', cursive; }
        .cert-logo-unified { filter: sepia(0.45) saturate(0.55) brightness(0.97) contrast(1.05); }
        @media print {
          @page { size: A4 landscape; margin: 0; }
          body { background: ${BG_CREAM} !important; }
        }
      `}</style>

      <div
        ref={isEmbed ? containerRef : undefined}
        className={`print:p-12 ${isEmbed ? 'fixed inset-0 flex items-center justify-center overflow-hidden' : 'min-h-screen p-8'}`}
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
                className="inline-flex items-center gap-2 rounded-lg bg-sancta-maroon px-4 py-2 font-medium text-white hover:bg-sancta-maroon-dark"
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
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 40h6v6H0zM74 40h6v6h-6zM40 0h6v6h-6zM40 74h6v6h-6z' fill='%23c9a227' fill-opacity='0.10'/%3E%3Cpath d='M10 10c8 5 14 5 22 0 8-5 14-5 22 0' fill='none' stroke='%23c9a227' stroke-opacity='0.18' stroke-width='1.2'/%3E%3C/svg%3E")`,
              border: `3px double ${GOLD}`,
            }}
          >
            <CornerFiligree position="top-left" />
            <CornerFiligree position="top-right" />
            <CornerFiligree position="bottom-left" />
            <CornerFiligree position="bottom-right" />

            {/* Header */}
            <header className="relative z-10 text-center pb-2">
              <div className="mx-auto w-full max-w-2xl cert-logo-unified" aria-hidden>
                <Image
                  src="/images/marriage-header-logo.png"
                  alt=""
                  width={900}
                  height={170}
                  className="w-full h-auto object-contain"
                  unoptimized
                />
              </div>
              <h1 className="mt-3 text-xl font-serif font-bold uppercase tracking-[0.22em]" style={{ color: TEXT_MAROON }}>
                MARRIAGE CERTIFICATE
              </h1>
              <p className="mt-1.5 text-base font-semibold" style={{ color: TEXT_BLACK }}>
                {churchSubtitle}
              </p>
            </header>

            <DecorativeLine />

            {/* Groom / Bride details */}
            <div className="relative z-10 mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="text-center">
                <p className="text-sm font-serif font-bold uppercase tracking-[0.25em]" style={{ color: TEXT_MAROON }}>
                  GROOM
                </p>
                <div className="mt-2 space-y-1.5">
                  <DataLine label="Full Name:" value={groomFullName} />
                  <DataLine label="Date of Birth:" value={groomDobStr} />
                  <DataLine label="Father:" value={marriage.groomFatherName || '—'} />
                  <DataLine label="Mother:" value={marriage.groomMotherName || '—'} />
                  <DataLine label="Baptised at:" value={groomBaptisedAt} />
                  <DataLine label="Confirmation:" value={groomConfirmation} />
                </div>
              </div>

              <div className="text-center">
                <p className="text-sm font-serif font-bold uppercase tracking-[0.25em]" style={{ color: TEXT_MAROON }}>
                  BRIDE
                </p>
                <div className="mt-2 space-y-1.5">
                  <DataLine label="Full Name:" value={brideFullName} />
                  <DataLine label="Date of Birth:" value={brideDobStr} />
                  <DataLine label="Father:" value={marriage.brideFatherName || '—'} />
                  <DataLine label="Mother:" value={marriage.brideMotherName || '—'} />
                  <DataLine label="Baptised at:" value={brideBaptisedAt} />
                  <DataLine label="Confirmation:" value={brideConfirmation} />
                </div>
              </div>
            </div>

            {/* Center certification */}
            <div className="relative z-10 mt-6 text-center">
              <p className="text-sm" style={{ color: TEXT_BLACK }}>
                This is to certify that
              </p>
              <div className="mt-2 text-2xl font-bold uppercase tracking-widest" style={{ color: TEXT_MAROON }}>
                <span className="block">{groomFullName.toUpperCase()}</span>
                <span className="block mt-0.5 text-sm font-normal tracking-[0.18em]" style={{ color: TEXT_MAROON }}>
                  and
                </span>
                <span className="block">{brideFullName.toUpperCase()}</span>
              </div>
              <p className="mt-2 text-sm" style={{ color: TEXT_BLACK }}>
                were lawfully united in Holy Matrimony on <strong>{marriageDateStr}</strong> at{' '}
                <strong>{churchSubtitle}</strong>.
              </p>
            </div>

            <DecorativeLine />

            {/* Footer: seal | signature | metadata */}
            <footer className="relative z-10 mt-10 pt-4">
              <div className="flex flex-wrap items-end justify-between gap-8">
                {/* Seal */}
                <div className="flex flex-col items-center shrink-0">
                  <div
                    className="relative w-24 h-24 rounded-full overflow-hidden flex items-center justify-center"
                    style={{ border: `2px solid ${GOLD}`, backgroundColor: BG_CREAM }}
                    aria-hidden
                  >
                    <SealSunburst />
                    <div
                      className="absolute inset-2 rounded-full overflow-hidden flex items-center justify-center cert-logo-unified"
                      style={{ backgroundColor: BG_CREAM }}
                    >
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
                </div>

                {/* Signature */}
                <div className="flex-1 min-w-[220px] text-center">
                  <div className="mx-auto max-w-[200px] h-px" style={{ backgroundColor: TEXT_BLACK }} aria-hidden />
                  <p className="mt-2 cert-script text-xl italic" style={{ color: TEXT_BLACK }}>
                    {marriage.officiatingPriest || '—'}
                  </p>
                  <p
                    className="mt-0.5 text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: TEXT_BLACK, opacity: 0.9 }}
                  >
                    Parish Priest
                  </p>
                </div>

                {/* Metadata */}
                <div className="text-right shrink-0 text-xs space-y-0.5" style={{ color: TEXT_BLACK }}>
                  <p>
                    <span className="font-medium">Date Issued:</span> {formatDateIssued()}
                  </p>
                  <p>
                    <span className="font-medium">Certificate No:</span>{' '}
                    {certificateNo(marriage.id ?? 0, churchSubtitle)}
                  </p>
                  <p>
                    <span className="font-medium">Register:</span> Marriage Register
                    {marriage.marriageRegister ? ` – ${marriage.marriageRegister}` : ' – —'}
                  </p>
                  <p>
                    <span className="font-medium">Page:</span> —
                  </p>
                  <p>
                    <span className="font-medium">Entry:</span> —
                  </p>
                </div>
              </div>
            </footer>
          </article>
        </div>
      </div>
    </>
  );
}

function DataLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-[11px] font-medium" style={{ color: TEXT_BLACK }}>
        {label}
      </span>
      <span className="text-[11px] font-semibold text-right flex-1" style={{ color: TEXT_BLACK }}>
        {value || '—'}
      </span>
    </div>
  );
}

function SealSunburst() {
  const rays = 28;
  return (
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" aria-hidden>
      {Array.from({ length: rays }, (_, i) => {
        const a = (i * (360 / rays)) * Math.PI / 180;
        const x1 = 50 + 38 * Math.cos(a);
        const y1 = 50 + 38 * Math.sin(a);
        const x2 = 50 + 50 * Math.cos(a);
        const y2 = 50 + 50 * Math.sin(a);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={GOLD} strokeWidth="1.5" strokeLinecap="round" />;
      })}
    </svg>
  );
}

function CornerFiligree({ position }: { position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' }) {
  const base = 'absolute w-28 h-28 pointer-events-none';
  const pos = {
    'top-left': 'top-2 left-2',
    'top-right': 'top-2 right-2 scale-x-[-1]',
    'bottom-left': 'bottom-2 left-2 scale-y-[-1]',
    'bottom-right': 'bottom-2 right-2 scale-x-[-1] scale-y-[-1]',
  }[position];
  return (
    <div className={`${base} ${pos}`} style={{ color: GOLD }} aria-hidden>
      <svg viewBox="0 0 96 96" fill="none" stroke="currentColor" strokeWidth="1" className="w-full h-full opacity-85">
        <path d="M0 0 L48 0 M0 0 L0 48" strokeWidth="1.5" />
        <path d="M4 4 L44 4 M4 4 L4 44" strokeWidth="1" />
        <path d="M8 8 Q28 8 44 8 M8 8 Q8 28 8 44" strokeWidth="0.9" strokeLinecap="round" />
        <path d="M12 12 Q24 12 36 12 M12 12 Q12 24 12 36" strokeWidth="0.7" strokeLinecap="round" />
        <path d="M16 16 Q22 16 28 16 M16 16 Q16 22 16 28" strokeWidth="0.55" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function DecorativeLine() {
  return (
    <div className="flex items-center justify-center gap-2 py-2" aria-hidden>
      <span className="flex-1 h-px max-w-[150px]" style={{ backgroundColor: GOLD, opacity: 0.9 }} />
      <span className="text-xs" style={{ color: GOLD }}>✦</span>
      <span className="flex-1 h-px max-w-[150px]" style={{ backgroundColor: GOLD, opacity: 0.9 }} />
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
