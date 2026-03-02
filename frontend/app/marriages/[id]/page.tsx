'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { useParish } from '@/context/ParishContext';
import {
  fetchMarriage,
  fetchBaptism,
  fetchCommunion,
  fetchConfirmation,
  fetchBaptismExternalCertificate,
  fetchCommunionCertificate,
  fetchMarriagePartyCertificate,
  type MarriageResponse,
  type MarriagePartyResponse,
  type BaptismResponse,
  type FirstHolyCommunionResponse,
  type ConfirmationResponse,
} from '@/lib/api';

function formatDisplayDate(isoDate: string): string {
  if (!isoDate) return '—';
  const d = new Date(isoDate + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function formatTime(isoTime: string | null | undefined): string {
  if (!isoTime) return '—';
  const [h, m] = isoTime.split(':');
  const hour = parseInt(h ?? '0', 10);
  const min = m ?? '00';
  const am = hour < 12;
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${h12}:${min} ${am ? 'AM' : 'PM'}`;
}

const cardClass = 'rounded-xl border border-gray-200 bg-white p-5 shadow-sm';

function PeopleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  );
}

function FolderIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function NotesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  );
}

function CrossIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v20M2 12h20" />
    </svg>
  );
}

/** Placeholder when a sacrament is not linked for this party */
function SacramentPlaceholder({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 border-b border-gray-100 pb-3 last:border-0 last:pb-0">
      <div className="h-16 w-20 shrink-0 rounded border border-gray-200 bg-gray-50 flex items-center justify-center text-xs text-gray-400">
        —
      </div>
      <div className="min-w-0 flex-1">
        <span className="text-sm font-medium text-gray-500">{title}</span>
        <p className="text-xs text-gray-500 mt-0.5">Not linked</p>
      </div>
    </div>
  );
}

/** One row: sacrament type, summary, thumbnail from linked record, View & Download link */
function SacramentRowNext({
  title,
  recordId,
  dateLabel,
  parishLabel,
  certEmbedUrl,
  certExternalUrl,
  certLoading,
  certError,
  recordLink,
  certificatePagePath,
}: {
  title: string;
  recordId: number;
  dateLabel: string;
  parishLabel: string;
  certEmbedUrl: string | null;
  certExternalUrl: string | null;
  certLoading: boolean;
  certError: string | null;
  recordLink: string;
  certificatePagePath: string;
}) {
  const src = certExternalUrl || certEmbedUrl;
  return (
    <div className="flex flex-col gap-2 border-b border-gray-100 pb-3 last:border-0 last:pb-0">
      <div className="flex gap-3">
        <div className="h-16 w-20 shrink-0 overflow-hidden rounded border border-gray-200 bg-gray-50">
          {certLoading && <div className="flex h-full items-center justify-center text-xs text-gray-500">Loading…</div>}
          {certError && <div className="flex h-full items-center justify-center text-xs text-red-600">Error</div>}
          {!certLoading && !certError && src && (
            certExternalUrl ? (
              <iframe src={`${certExternalUrl}#view=FitH`} title={title} className="h-full w-full border-0 scale-[0.4] origin-top-left" style={{ width: '250%', height: '250%' }} />
            ) : (
              <iframe src={certEmbedUrl!} title={title} className="h-full w-full border-0 scale-[0.4] origin-top-left" style={{ width: '250%', height: '250%' }} />
            )
          )}
        </div>
        <div className="min-w-0 flex-1">
          <Link href={recordLink} className="text-sm font-medium text-sancta-maroon hover:underline">
            {title} #{recordId}
          </Link>
          <p className="text-xs text-gray-600 mt-0.5">{dateLabel}{parishLabel ? ` @ ${parishLabel}` : ''}</p>
          <Link
            href={certificatePagePath}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-sancta-maroon hover:underline"
          >
            <DownloadIcon className="h-3.5 w-3.5" />
            View &amp; Download Certificate
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function MarriageViewPage() {
  const params = useParams();
  const { parishId } = useParish();
  const id = typeof params.id === 'string' ? parseInt(params.id, 10) : NaN;
  const [marriage, setMarriage] = useState<MarriageResponse | null | undefined>(undefined);

  const [groomBaptism, setGroomBaptism] = useState<BaptismResponse | null>(null);
  const [groomCommunion, setGroomCommunion] = useState<FirstHolyCommunionResponse | null>(null);
  const [groomConfirmation, setGroomConfirmation] = useState<ConfirmationResponse | null>(null);
  const [brideBaptism, setBrideBaptism] = useState<BaptismResponse | null>(null);
  const [brideCommunion, setBrideCommunion] = useState<FirstHolyCommunionResponse | null>(null);
  const [brideConfirmation, setBrideConfirmation] = useState<ConfirmationResponse | null>(null);

  const [groomBaptismCertUrl, setGroomBaptismCertUrl] = useState<string | null>(null);
  const groomBaptismCertRef = useRef<string | null>(null);
  const [groomCommunionCertUrl, setGroomCommunionCertUrl] = useState<string | null>(null);
  const groomCommunionCertRef = useRef<string | null>(null);
  const [brideBaptismCertUrl, setBrideBaptismCertUrl] = useState<string | null>(null);
  const brideBaptismCertRef = useRef<string | null>(null);
  const [brideCommunionCertUrl, setBrideCommunionCertUrl] = useState<string | null>(null);
  const brideCommunionCertRef = useRef<string | null>(null);
  const [groomConfirmationCertUrl, setGroomConfirmationCertUrl] = useState<string | null>(null);
  const groomConfirmationCertRef = useRef<string | null>(null);
  const [brideConfirmationCertUrl, setBrideConfirmationCertUrl] = useState<string | null>(null);
  const brideConfirmationCertRef = useRef<string | null>(null);

  useEffect(() => {
    if (Number.isNaN(id)) {
      setMarriage(null);
      return;
    }
    let cancelled = false;
    fetchMarriage(id).then((m) => {
      if (!cancelled) setMarriage(m ?? null);
    }).catch(() => {
      if (!cancelled) setMarriage(null);
    });
    return () => { cancelled = true; };
  }, [id]);

  const groom = marriage?.parties?.find((p) => String(p.role).toUpperCase() === 'GROOM');
  const bride = marriage?.parties?.find((p) => String(p.role).toUpperCase() === 'BRIDE');

  useEffect(() => {
    if (!groom?.baptismId) {
      setGroomBaptism(null);
      return;
    }
    let cancelled = false;
    fetchBaptism(groom.baptismId).then((b) => {
      if (!cancelled) setGroomBaptism(b ?? null);
    }).catch(() => { if (!cancelled) setGroomBaptism(null); });
    return () => { cancelled = true; };
  }, [groom?.baptismId]);

  useEffect(() => {
    if (!groom?.communionId) {
      setGroomCommunion(null);
      return;
    }
    let cancelled = false;
    fetchCommunion(groom.communionId).then((c) => {
      if (!cancelled) setGroomCommunion(c ?? null);
    }).catch(() => { if (!cancelled) setGroomCommunion(null); });
    return () => { cancelled = true; };
  }, [groom?.communionId]);

  useEffect(() => {
    if (!groom?.confirmationId) {
      setGroomConfirmation(null);
      return;
    }
    let cancelled = false;
    fetchConfirmation(groom.confirmationId).then((c) => {
      if (!cancelled) setGroomConfirmation(c ?? null);
    }).catch(() => { if (!cancelled) setGroomConfirmation(null); });
    return () => { cancelled = true; };
  }, [groom?.confirmationId]);

  useEffect(() => {
    if (!bride?.baptismId) {
      setBrideBaptism(null);
      return;
    }
    let cancelled = false;
    fetchBaptism(bride.baptismId).then((b) => {
      if (!cancelled) setBrideBaptism(b ?? null);
    }).catch(() => { if (!cancelled) setBrideBaptism(null); });
    return () => { cancelled = true; };
  }, [bride?.baptismId]);

  useEffect(() => {
    if (!bride?.communionId) {
      setBrideCommunion(null);
      return;
    }
    let cancelled = false;
    fetchCommunion(bride.communionId).then((c) => {
      if (!cancelled) setBrideCommunion(c ?? null);
    }).catch(() => { if (!cancelled) setBrideCommunion(null); });
    return () => { cancelled = true; };
  }, [bride?.communionId]);

  useEffect(() => {
    if (!bride?.confirmationId) {
      setBrideConfirmation(null);
      return;
    }
    let cancelled = false;
    fetchConfirmation(bride.confirmationId).then((c) => {
      if (!cancelled) setBrideConfirmation(c ?? null);
    }).catch(() => { if (!cancelled) setBrideConfirmation(null); });
    return () => { cancelled = true; };
  }, [bride?.confirmationId]);

  useEffect(() => {
    if (!groomBaptism?.externalCertificatePath || !groom?.baptismId) return;
    let cancelled = false;
    fetchBaptismExternalCertificate(groom.baptismId)
      .then((blob) => {
        if (cancelled) return;
        if (groomBaptismCertRef.current) URL.revokeObjectURL(groomBaptismCertRef.current);
        groomBaptismCertRef.current = URL.createObjectURL(blob);
        setGroomBaptismCertUrl(groomBaptismCertRef.current);
      })
      .catch(() => {})
      .finally(() => {});
    return () => {
      cancelled = true;
      if (groomBaptismCertRef.current) {
        URL.revokeObjectURL(groomBaptismCertRef.current);
        groomBaptismCertRef.current = null;
      }
      setGroomBaptismCertUrl(null);
    };
  }, [groom?.baptismId, groomBaptism?.externalCertificatePath]);

  useEffect(() => {
    if (!groomCommunion?.communionCertificatePath || !groom?.communionId) return;
    let cancelled = false;
    fetchCommunionCertificate(groom.communionId)
      .then((blob) => {
        if (cancelled) return;
        if (groomCommunionCertRef.current) URL.revokeObjectURL(groomCommunionCertRef.current);
        groomCommunionCertRef.current = URL.createObjectURL(blob);
        setGroomCommunionCertUrl(groomCommunionCertRef.current);
      })
      .catch(() => {})
      .finally(() => {});
    return () => {
      cancelled = true;
      if (groomCommunionCertRef.current) {
        URL.revokeObjectURL(groomCommunionCertRef.current);
        groomCommunionCertRef.current = null;
      }
      setGroomCommunionCertUrl(null);
    };
  }, [groom?.communionId, groomCommunion?.communionCertificatePath]);

  useEffect(() => {
    if (!brideBaptism?.externalCertificatePath || !bride?.baptismId) return;
    let cancelled = false;
    fetchBaptismExternalCertificate(bride.baptismId)
      .then((blob) => {
        if (cancelled) return;
        if (brideBaptismCertRef.current) URL.revokeObjectURL(brideBaptismCertRef.current);
        brideBaptismCertRef.current = URL.createObjectURL(blob);
        setBrideBaptismCertUrl(brideBaptismCertRef.current);
      })
      .catch(() => {})
      .finally(() => {});
    return () => {
      cancelled = true;
      if (brideBaptismCertRef.current) {
        URL.revokeObjectURL(brideBaptismCertRef.current);
        brideBaptismCertRef.current = null;
      }
      setBrideBaptismCertUrl(null);
    };
  }, [bride?.baptismId, brideBaptism?.externalCertificatePath]);

  useEffect(() => {
    if (!brideCommunion?.communionCertificatePath || !bride?.communionId) return;
    let cancelled = false;
    fetchCommunionCertificate(bride.communionId)
      .then((blob) => {
        if (cancelled) return;
        if (brideCommunionCertRef.current) URL.revokeObjectURL(brideCommunionCertRef.current);
        brideCommunionCertRef.current = URL.createObjectURL(blob);
        setBrideCommunionCertUrl(brideCommunionCertRef.current);
      })
      .catch(() => {})
      .finally(() => {});
    return () => {
      cancelled = true;
      if (brideCommunionCertRef.current) {
        URL.revokeObjectURL(brideCommunionCertRef.current);
        brideCommunionCertRef.current = null;
      }
      setBrideCommunionCertUrl(null);
    };
  }, [bride?.communionId, brideCommunion?.communionCertificatePath]);

  useEffect(() => {
    if (!groom?.confirmationCertificatePath) return;
    let cancelled = false;
    fetchMarriagePartyCertificate(id, 'groom', 'confirmation')
      .then((blob) => {
        if (cancelled) return;
        if (groomConfirmationCertRef.current) URL.revokeObjectURL(groomConfirmationCertRef.current);
        groomConfirmationCertRef.current = URL.createObjectURL(blob);
        setGroomConfirmationCertUrl(groomConfirmationCertRef.current);
      })
      .catch(() => {})
      .finally(() => {});
    return () => {
      cancelled = true;
      if (groomConfirmationCertRef.current) {
        URL.revokeObjectURL(groomConfirmationCertRef.current);
        groomConfirmationCertRef.current = null;
      }
      setGroomConfirmationCertUrl(null);
    };
  }, [id, groom?.confirmationCertificatePath]);

  useEffect(() => {
    if (!bride?.confirmationCertificatePath) return;
    let cancelled = false;
    fetchMarriagePartyCertificate(id, 'bride', 'confirmation')
      .then((blob) => {
        if (cancelled) return;
        if (brideConfirmationCertRef.current) URL.revokeObjectURL(brideConfirmationCertRef.current);
        brideConfirmationCertRef.current = URL.createObjectURL(blob);
        setBrideConfirmationCertUrl(brideConfirmationCertRef.current);
      })
      .catch(() => {})
      .finally(() => {});
    return () => {
      cancelled = true;
      if (brideConfirmationCertRef.current) {
        URL.revokeObjectURL(brideConfirmationCertRef.current);
        brideConfirmationCertRef.current = null;
      }
      setBrideConfirmationCertUrl(null);
    };
  }, [id, bride?.confirmationCertificatePath]);

  if (Number.isNaN(id)) {
    return (
      <AuthenticatedLayout>
        <p className="text-red-600">Invalid marriage id.</p>
      </AuthenticatedLayout>
    );
  }

  if (marriage === undefined) {
    return (
      <AuthenticatedLayout>
        <p className="text-gray-600">Loading…</p>
      </AuthenticatedLayout>
    );
  }

  if (marriage === null) {
    return (
      <AuthenticatedLayout>
        <h1 className="text-2xl font-serif font-semibold text-sancta-maroon">Marriage Record</h1>
        <p className="mt-4 text-gray-600">Marriage record not found.</p>
        <Link href="/marriages" className="mt-4 inline-block text-sancta-maroon hover:underline">
          Back to marriages
        </Link>
      </AuthenticatedLayout>
    );
  }

  const hasParties = Boolean(marriage.parties?.length);
  const witnessesList = marriage.witnesses?.map((w) => w.fullName).join(', ') ?? '—';

  if (!hasParties) {
    return (
      <AuthenticatedLayout>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Link href="/marriages" className="text-sancta-maroon hover:underline">
            ← Back to marriages
          </Link>
          {parishId != null && (
            <Link
              href={`/marriages/new?parishId=${parishId}`}
              className="rounded-lg bg-sancta-maroon px-4 py-2 text-white font-medium hover:bg-sancta-maroon-dark text-sm"
            >
              Add marriage
            </Link>
          )}
        </div>
        <h1 className="text-2xl font-serif font-semibold text-sancta-maroon">
          Marriage Record — {formatDisplayDate(marriage.marriageDate)}
        </h1>
        <p className="mt-1 text-gray-700">{marriage.partnersName}</p>
        <dl className="mt-6 grid gap-2 sm:grid-cols-2">
          <dt className="text-sm font-medium text-gray-500">Marriage date</dt>
          <dd className="text-gray-900">{marriage.marriageDate}</dd>
          <dt className="text-sm font-medium text-gray-500">Officiating priest</dt>
          <dd className="text-gray-900">{marriage.officiatingPriest}</dd>
          <dt className="text-sm font-medium text-gray-500">Parish</dt>
          <dd className="text-gray-900">{marriage.parish}</dd>
          {marriage.baptismId != null && (
            <>
              <dt className="text-sm font-medium text-gray-500">Baptism</dt>
              <dd className="text-gray-900">
                <Link href={`/baptisms/${marriage.baptismId}`} className="text-sancta-maroon hover:underline">
                  Baptism #{marriage.baptismId}
                </Link>
              </dd>
            </>
          )}
          {marriage.communionId != null && (
            <>
              <dt className="text-sm font-medium text-gray-500">Communion</dt>
              <dd className="text-gray-900">
                <Link href={`/communions/${marriage.communionId}`} className="text-sancta-maroon hover:underline">
                  Communion #{marriage.communionId}
                </Link>
              </dd>
            </>
          )}
          {marriage.confirmationId != null && (
            <>
              <dt className="text-sm font-medium text-gray-500">Confirmation</dt>
              <dd className="text-gray-900">
                <Link href={`/confirmations/${marriage.confirmationId}`} className="text-sancta-maroon hover:underline">
                  Confirmation #{marriage.confirmationId}
                </Link>
              </dd>
            </>
          )}
        </dl>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Link href="/marriages" className="text-gray-500 hover:text-gray-700 hover:underline">
          ← Back to Marriages
        </Link>
        {parishId != null && (
          <Link
            href={`/marriages/new?parishId=${parishId}`}
            className="rounded-lg bg-sancta-maroon px-4 py-2 text-white font-medium hover:bg-sancta-maroon-dark text-sm"
          >
            Add marriage
          </Link>
        )}
      </div>
      <h1 className="text-2xl font-serif font-semibold text-sancta-maroon">
        Marriage Record — {formatDisplayDate(marriage.marriageDate)}
      </h1>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left column */}
        <div className="space-y-6">
          {groom && (
            <section className={cardClass}>
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <PeopleIcon className="h-5 w-5 text-gray-500" />
                Groom&apos;s Information
              </h2>
              <PartyInfo party={groom} />
            </section>
          )}

          {groom && (
            <section className={cardClass}>
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <PeopleIcon className="h-5 w-5 text-gray-500" />
                {groom.fullName} — {marriage.marriageDate ? formatDisplayDate(marriage.marriageDate).split(' ')[0] : ''} {marriage.marriageDate?.slice(0, 4)}
              </h2>
              <div className="mt-3 space-y-3">
                {groom.baptismId != null ? (
                  <SacramentRowNext
                    title="Baptism Record"
                    recordId={groom.baptismId}
                    dateLabel={groomBaptism ? formatDisplayDate(groomBaptism.dateOfBirth) : '—'}
                    parishLabel={groomBaptism?.parishName ?? groom.baptismChurch ?? '—'}
                    certEmbedUrl={groomBaptism?.externalCertificatePath ? null : `/baptisms/${groom.baptismId}/certificate?embed=1`}
                    certExternalUrl={groomBaptismCertUrl}
                    certLoading={Boolean(groomBaptism?.externalCertificatePath && !groomBaptismCertUrl)}
                    certError={null}
                    recordLink={`/baptisms/${groom.baptismId}`}
                    certificatePagePath={`/baptisms/${groom.baptismId}/certificate`}
                  />
                ) : (
                  <SacramentPlaceholder title="Baptism Record" />
                )}
                {groom.communionId != null ? (
                  <SacramentRowNext
                    title="First Holy Communion Record"
                    recordId={groom.communionId}
                    dateLabel={groomCommunion ? formatDisplayDate(groomCommunion.communionDate) : '—'}
                    parishLabel={groomCommunion?.parish ?? groom.communionChurch ?? '—'}
                    certEmbedUrl={groomCommunion?.communionCertificatePath ? null : `/communions/${groom.communionId}/certificate?embed=1`}
                    certExternalUrl={groomCommunionCertUrl}
                    certLoading={Boolean(groomCommunion?.communionCertificatePath && !groomCommunionCertUrl)}
                    certError={null}
                    recordLink={`/communions/${groom.communionId}`}
                    certificatePagePath={`/communions/${groom.communionId}/certificate`}
                  />
                ) : (
                  <SacramentPlaceholder title="First Holy Communion Record" />
                )}
                {groom.confirmationId != null ? (
                  <SacramentRowNext
                    title="Confirmation Record"
                    recordId={groom.confirmationId}
                    dateLabel={groomConfirmation ? formatDisplayDate(groomConfirmation.confirmationDate) : '—'}
                    parishLabel={groomConfirmation?.parish ?? groom.confirmationChurch ?? '—'}
                    certEmbedUrl={groom.confirmationCertificatePath ? null : `/confirmations/${groom.confirmationId}/certificate?embed=1`}
                    certExternalUrl={groomConfirmationCertUrl}
                    certLoading={Boolean(groom.confirmationCertificatePath && !groomConfirmationCertUrl)}
                    certError={null}
                    recordLink={`/confirmations/${groom.confirmationId}`}
                    certificatePagePath={groomConfirmationCertUrl ?? `/confirmations/${groom.confirmationId}/certificate`}
                  />
                ) : (
                  <SacramentPlaceholder title="Confirmation Record" />
                )}
              </div>
            </section>
          )}

          <section className={cardClass}>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <ClockIcon className="h-5 w-5 text-gray-500" />
              Marriage Details
            </h2>
            <dl className="mt-4 grid gap-x-4 gap-y-2 sm:grid-cols-[auto_1fr]">
              <dt className="text-sm font-medium text-gray-500">Marriage Date</dt>
              <dd className="text-gray-900">{formatDisplayDate(marriage.marriageDate)}</dd>
              <dt className="text-sm font-medium text-gray-500">Time</dt>
              <dd className="text-gray-900">{formatTime(marriage.marriageTime)}</dd>
              <dt className="text-sm font-medium text-gray-500">Parish</dt>
              <dd className="text-gray-900">{marriage.parish}</dd>
              {marriage.churchName && (
                <>
                  <dt className="text-sm font-medium text-gray-500">Church</dt>
                  <dd className="text-gray-900">{marriage.churchName}</dd>
                </>
              )}
              {marriage.marriageRegister && (
                <>
                  <dt className="text-sm font-medium text-gray-500">Marriage Register #</dt>
                  <dd className="text-gray-900">{marriage.marriageRegister}</dd>
                </>
              )}
              {marriage.civilRegistryNumber && (
                <>
                  <dt className="text-sm font-medium text-gray-500">Civil Marriage Registered</dt>
                  <dd className="text-gray-900">{marriage.civilRegistryNumber}</dd>
                </>
              )}
              <dt className="text-sm font-medium text-gray-500">Officiating Clergy</dt>
              <dd className="text-gray-900">{marriage.officiatingPriest}</dd>
              <dt className="text-sm font-medium text-gray-500">Witnesses</dt>
              <dd className="text-gray-900">{witnessesList}</dd>
            </dl>
          </section>

          <section className={cardClass}>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <NotesIcon className="h-5 w-5 text-gray-500" />
              Sacramental Records
            </h2>
            <p className="mt-1 text-sm text-gray-500">Add internal notes about this marriage record (optional)</p>
            <textarea
              readOnly
              placeholder="e.g. Follow-up actions, observations..."
              rows={4}
              className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-500 bg-gray-50"
            />
            <button type="button" disabled className="mt-3 rounded-lg bg-gray-300 px-4 py-2 font-medium text-white cursor-not-allowed text-sm">
              Save Note
            </button>
          </section>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {bride && (
            <section className={cardClass}>
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <HeartIcon className="h-5 w-5 text-gray-500" />
                Bride&apos;s Information
              </h2>
              <PartyInfo party={bride} />
            </section>
          )}

          {bride && (
            <section className={cardClass}>
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <HeartIcon className="h-5 w-5 text-gray-500" />
                {bride.fullName} — {marriage.marriageDate ? formatDisplayDate(marriage.marriageDate).split(' ')[0] : ''} {marriage.marriageDate?.slice(0, 4)}
              </h2>
              <div className="mt-3 space-y-3">
                {bride.baptismId != null ? (
                  <SacramentRowNext
                    title="Baptism Record"
                    recordId={bride.baptismId}
                    dateLabel={brideBaptism ? formatDisplayDate(brideBaptism.dateOfBirth) : '—'}
                    parishLabel={brideBaptism?.parishName ?? bride.baptismChurch ?? '—'}
                    certEmbedUrl={brideBaptism?.externalCertificatePath ? null : `/baptisms/${bride.baptismId}/certificate?embed=1`}
                    certExternalUrl={brideBaptismCertUrl}
                    certLoading={Boolean(brideBaptism?.externalCertificatePath && !brideBaptismCertUrl)}
                    certError={null}
                    recordLink={`/baptisms/${bride.baptismId}`}
                    certificatePagePath={`/baptisms/${bride.baptismId}/certificate`}
                  />
                ) : (
                  <SacramentPlaceholder title="Baptism Record" />
                )}
                {bride.communionId != null ? (
                  <SacramentRowNext
                    title="First Holy Communion Record"
                    recordId={bride.communionId}
                    dateLabel={brideCommunion ? formatDisplayDate(brideCommunion.communionDate) : '—'}
                    parishLabel={brideCommunion?.parish ?? bride.communionChurch ?? '—'}
                    certEmbedUrl={brideCommunion?.communionCertificatePath ? null : `/communions/${bride.communionId}/certificate?embed=1`}
                    certExternalUrl={brideCommunionCertUrl}
                    certLoading={Boolean(brideCommunion?.communionCertificatePath && !brideCommunionCertUrl)}
                    certError={null}
                    recordLink={`/communions/${bride.communionId}`}
                    certificatePagePath={`/communions/${bride.communionId}/certificate`}
                  />
                ) : (
                  <SacramentPlaceholder title="First Holy Communion Record" />
                )}
                {bride.confirmationId != null ? (
                  <SacramentRowNext
                    title="Confirmation Record"
                    recordId={bride.confirmationId}
                    dateLabel={brideConfirmation ? formatDisplayDate(brideConfirmation.confirmationDate) : '—'}
                    parishLabel={brideConfirmation?.parish ?? bride.confirmationChurch ?? '—'}
                    certEmbedUrl={bride.confirmationCertificatePath ? null : `/confirmations/${bride.confirmationId}/certificate?embed=1`}
                    certExternalUrl={brideConfirmationCertUrl}
                    certLoading={Boolean(bride.confirmationCertificatePath && !brideConfirmationCertUrl)}
                    certError={null}
                    recordLink={`/confirmations/${bride.confirmationId}`}
                    certificatePagePath={brideConfirmationCertUrl ?? `/confirmations/${bride.confirmationId}/certificate`}
                  />
                ) : (
                  <SacramentPlaceholder title="Confirmation Record" />
                )}
              </div>
            </section>
          )}

          <section className={cardClass}>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FolderIcon className="h-5 w-5 text-gray-500" />
              Canonical And Civil Requirements
            </h2>
            <dl className="mt-4 space-y-2 text-sm">
              {marriage.dispensationGranted != null && (
                <div>
                  <dt className="text-gray-500">Dispensation granted</dt>
                  <dd className="font-medium text-gray-900">{marriage.dispensationGranted ? 'Yes' : 'No'}</dd>
                </div>
              )}
              {marriage.civilRegistryNumber && (
                <div>
                  <dt className="text-gray-500">Civil Marriage License / Registry</dt>
                  <dd className="font-medium text-gray-900">{marriage.civilRegistryNumber}</dd>
                </div>
              )}
              {marriage.canonicalNotes && (
                <div>
                  <dt className="text-gray-500">Canonical notes</dt>
                  <dd className="text-gray-900">{marriage.canonicalNotes}</dd>
                </div>
              )}
            </dl>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href={`/marriages/${id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                View Fullscreen
              </Link>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500">
                <DownloadIcon className="h-4 w-4" />
                View &amp; Download Full Record
              </span>
              <Link
                href={`/marriages/${id}/certificate`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <DownloadIcon className="h-4 w-4" />
                Civil Marriage Certificate
              </Link>
            </div>
          </section>

          <section className={cardClass}>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FolderIcon className="h-5 w-5 text-gray-500" />
              Record Summary
            </h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div>
                <dt className="text-gray-500">Record ID</dt>
                <dd className="font-medium text-gray-900">MP/{marriage.id}</dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

function PartyInfo({ party }: { party: MarriagePartyResponse }) {
  return (
    <dl className="mt-4 grid gap-x-4 gap-y-2 sm:grid-cols-[auto_1fr]">
      <dt className="text-sm font-medium text-gray-500">Full Name</dt>
      <dd className="text-gray-900">{party.fullName}</dd>
      {party.dateOfBirth && (
        <>
          <dt className="text-sm font-medium text-gray-500">Date of Birth</dt>
          <dd className="text-gray-900">{formatDisplayDate(party.dateOfBirth)}</dd>
        </>
      )}
      {party.placeOfBirth && (
        <>
          <dt className="text-sm font-medium text-gray-500">Place of Birth</dt>
          <dd className="text-gray-900">{party.placeOfBirth}</dd>
        </>
      )}
      {party.nationality && (
        <>
          <dt className="text-sm font-medium text-gray-500">Nationality</dt>
          <dd className="text-gray-900">{party.nationality}</dd>
        </>
      )}
      {party.phone && (
        <>
          <dt className="text-sm font-medium text-gray-500">Phone</dt>
          <dd className="text-gray-900">{party.phone}</dd>
        </>
      )}
      {party.email && (
        <>
          <dt className="text-sm font-medium text-gray-500">Email</dt>
          <dd className="text-gray-900">{party.email}</dd>
        </>
      )}
      {party.residentialAddress && (
        <>
          <dt className="text-sm font-medium text-gray-500">Address</dt>
          <dd className="text-gray-900">{party.residentialAddress}</dd>
        </>
      )}
      {party.occupation && (
        <>
          <dt className="text-sm font-medium text-gray-500">Occupation</dt>
          <dd className="text-gray-900">{party.occupation}</dd>
        </>
      )}
    </dl>
  );
}
