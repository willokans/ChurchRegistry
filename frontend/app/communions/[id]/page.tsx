'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { useParish } from '@/context/ParishContext';
import {
  fetchCommunion,
  fetchBaptismExternalCertificate,
  fetchCommunionCertificate,
  updateCommunionNotes,
  fetchCommunionNoteHistory,
  type FirstHolyCommunionResponse,
  type BaptismNoteResponse,
} from '@/lib/api';
import { saveNotesOptimistically } from '@/lib/optimistic-notes';

function formatDisplayDate(isoDate: string): string {
  if (!isoDate) return '—';
  const d = new Date(isoDate + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function formatDateTime(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
}

const cardClass = 'rounded-xl border border-gray-200 bg-white p-5 shadow-sm';

function PeopleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
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

function CrossIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v20M2 12h20" />
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

function ExpandIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
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

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
    </svg>
  );
}

function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  );
}

export default function CommunionViewPage() {
  const params = useParams();
  const { parishId } = useParish();
  const id = typeof params.id === 'string' ? parseInt(params.id, 10) : NaN;
  const [communion, setCommunion] = useState<FirstHolyCommunionResponse | null | undefined>(undefined);
  const [baptismCertExpanded, setBaptismCertExpanded] = useState(false);
  const [baptismCertUrl, setBaptismCertUrl] = useState<string | null>(null);
  const [baptismCertIsPdf, setBaptismCertIsPdf] = useState(true);
  const baptismCertUrlRef = useRef<string | null>(null);
  const [baptismCertLoading, setBaptismCertLoading] = useState(false);
  const [baptismCertError, setBaptismCertError] = useState<string | null>(null);
  const [communionCertExpanded, setCommunionCertExpanded] = useState(false);
  const [communionCertUrl, setCommunionCertUrl] = useState<string | null>(null);
  const [communionCertIsPdf, setCommunionCertIsPdf] = useState(true);
  const communionCertUrlRef = useRef<string | null>(null);
  const [communionCertLoading, setCommunionCertLoading] = useState(false);
  const [communionCertError, setCommunionCertError] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);
  const [noteHistory, setNoteHistory] = useState<BaptismNoteResponse[]>([]);
  const [noteHistoryLoading, setNoteHistoryLoading] = useState(false);

  useEffect(() => {
    if (Number.isNaN(id)) {
      setCommunion(null);
      return;
    }
    let cancelled = false;
    fetchCommunion(id).then((c) => {
      if (!cancelled) {
        setCommunion(c ?? null);
        setNotes(c?.note ?? '');
      }
    }).catch(() => {
      if (!cancelled) setCommunion(null);
    });
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    if (communion?.id == null || Number.isNaN(id)) {
      setNoteHistory([]);
      return;
    }
    let cancelled = false;
    setNoteHistoryLoading(true);
    fetchCommunionNoteHistory(id).then((list) => {
      if (!cancelled) setNoteHistory(list);
    }).catch(() => {
      if (!cancelled) setNoteHistory([]);
    }).finally(() => {
      if (!cancelled) setNoteHistoryLoading(false);
    });
    return () => { cancelled = true; };
  }, [id, communion?.id]);

  useEffect(() => {
    if (!baptismCertExpanded || !communion?.baptismCertificatePath || Number.isNaN(communion.baptismId)) return;
    let cancelled = false;
    setBaptismCertLoading(true);
    setBaptismCertError(null);
    fetchBaptismExternalCertificate(communion.baptismId)
      .then((blob) => {
        if (cancelled) return;
        if (baptismCertUrlRef.current) URL.revokeObjectURL(baptismCertUrlRef.current);
        const url = URL.createObjectURL(blob);
        baptismCertUrlRef.current = url;
        setBaptismCertUrl(url);
        setBaptismCertIsPdf(blob.type === 'application/pdf');
      })
      .catch((e) => {
        if (!cancelled) setBaptismCertError(e instanceof Error ? e.message : 'Failed to load certificate');
      })
      .finally(() => {
        if (!cancelled) setBaptismCertLoading(false);
      });
    return () => {
      cancelled = true;
      if (baptismCertUrlRef.current) {
        URL.revokeObjectURL(baptismCertUrlRef.current);
        baptismCertUrlRef.current = null;
      }
      setBaptismCertUrl(null);
    };
  }, [baptismCertExpanded, communion?.baptismId, communion?.baptismCertificatePath]);

  const hasBaptismCert = Boolean(communion?.baptismCertificatePath);

  useEffect(() => {
    if (!communionCertExpanded || !communion?.communionCertificatePath || Number.isNaN(id)) return;
    let cancelled = false;
    setCommunionCertLoading(true);
    setCommunionCertError(null);
    fetchCommunionCertificate(id)
      .then((blob) => {
        if (cancelled) return;
        if (communionCertUrlRef.current) URL.revokeObjectURL(communionCertUrlRef.current);
        const url = URL.createObjectURL(blob);
        communionCertUrlRef.current = url;
        setCommunionCertUrl(url);
        setCommunionCertIsPdf(blob.type === 'application/pdf');
      })
      .catch((e) => {
        if (!cancelled) setCommunionCertError(e instanceof Error ? e.message : 'Failed to load certificate');
      })
      .finally(() => {
        if (!cancelled) setCommunionCertLoading(false);
      });
    return () => {
      cancelled = true;
      if (communionCertUrlRef.current) {
        URL.revokeObjectURL(communionCertUrlRef.current);
        communionCertUrlRef.current = null;
      }
      setCommunionCertUrl(null);
    };
  }, [communionCertExpanded, id, communion?.communionCertificatePath]);

  const hasCommunionCert = Boolean(communion?.communionCertificatePath);

  async function handleSaveNotes() {
    if (!communion) return;
    await saveNotesOptimistically({
      notes,
      noteHistory,
      entityId: communion.id,
      updateNotes: updateCommunionNotes,
      fetchNoteHistory: fetchCommunionNoteHistory,
      setNotes,
      setNoteHistory,
      setEntity: setCommunion,
      setNotesError,
      setSavingNotes,
      errorFallback: 'Failed to save notes',
    });
  }

  const handleDownloadCommunionCert = useCallback(async () => {
    if (!id) return;
    try {
      const blob = await fetchCommunionCertificate(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `communion-certificate-${communion?.baptismName ?? ''}-${communion?.surname ?? ''}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setCommunionCertError('Download failed');
    }
  }, [id, communion?.baptismName, communion?.surname]);

  const handleDownloadBaptismCert = useCallback(async () => {
    if (!communion?.baptismId) return;
    try {
      const blob = await fetchBaptismExternalCertificate(communion.baptismId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `baptism-certificate-${communion.baptismName ?? ''}-${communion.surname ?? ''}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setBaptismCertError('Download failed');
    }
  }, [communion?.baptismId, communion?.baptismName, communion?.surname]);

  if (Number.isNaN(id)) {
    return (
      <AuthenticatedLayout>
        <p className="text-red-600">Invalid communion id.</p>
      </AuthenticatedLayout>
    );
  }

  if (communion === undefined) {
    return (
      <AuthenticatedLayout>
        <p className="text-gray-600">Loading…</p>
      </AuthenticatedLayout>
    );
  }

  if (communion === null) {
    return (
      <AuthenticatedLayout>
        <h1 className="text-2xl font-serif font-semibold text-sancta-maroon">First Holy Communion</h1>
        <p className="mt-4 text-gray-600">Communion record not found.</p>
        <Link href="/communions" className="mt-4 inline-block text-sancta-maroon hover:underline">
          Back to communions
        </Link>
      </AuthenticatedLayout>
    );
  }

  const displayName = [communion.baptismName, communion.otherNames, communion.surname].filter(Boolean).join(' ').trim() || '—';

  return (
    <AuthenticatedLayout>
      <div className="mb-4">
        <Link href="/communions" className="text-gray-500 hover:text-gray-700 hover:underline">
          ← Back to Communions
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-8">
        <h1 className="text-2xl font-serif font-semibold text-sancta-maroon">
          Holy Communion Record
        </h1>
        {communion.parish && (
          <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
            Received at {communion.parish}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          <section className={cardClass}>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <PeopleIcon className="h-5 w-5 text-gray-500" />
              Communicant&apos;s Information
            </h2>
            <dl className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-[auto_1fr]">
              <dt className="text-sm font-medium text-gray-700">Full Name</dt>
              <dd className="text-gray-900">{displayName}</dd>
              <dt className="text-sm font-medium text-gray-700">Date of Birth</dt>
              <dd className="text-gray-900">{formatDisplayDate(communion.dateOfBirth ?? '')}</dd>
              <dt className="text-sm font-medium text-gray-700">Baptism Record</dt>
              <dd className="text-gray-900">
                <div className="flex flex-col gap-0.5">
                  <Link
                    href={`/baptisms/${communion.baptismId}`}
                    className="text-sancta-maroon hover:underline inline-flex items-center gap-1 w-fit"
                  >
                    Baptism #{communion.baptismId}
                  </Link>
                  {(communion.dateOfBirth || communion.baptismParishName) && (
                    <span className="text-gray-700">
                      {communion.dateOfBirth && formatDisplayDate(communion.dateOfBirth)}
                      {communion.dateOfBirth && communion.baptismParishName && ' @ '}
                      {communion.baptismParishName ? (
                        <Link
                          href={`/baptisms/${communion.baptismId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sancta-maroon hover:underline inline-flex items-center gap-1"
                        >
                          {communion.baptismParishName}
                          <ExternalLinkIcon className="h-4 w-4" />
                        </Link>
                      ) : null}
                    </span>
                  )}
                </div>
              </dd>
            </dl>
          </section>

          <section className={cardClass}>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FolderIcon className="h-5 w-5 text-gray-500" />
              Holy Communion Details
            </h2>
            <dl className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-[auto_1fr]">
              <dt className="text-sm font-medium text-gray-700">Communion Date</dt>
              <dd className="text-gray-900">{formatDisplayDate(communion.communionDate)}</dd>
              <dt className="text-sm font-medium text-gray-700">Officiating Priest</dt>
              <dd className="text-gray-900">{communion.officiatingPriest}</dd>
              <dt className="text-sm font-medium text-gray-700">Parish</dt>
              <dd className="text-gray-900">
                <span>{communion.parish}</span>
                <ExternalLinkIcon className="h-4 w-4 inline-block ml-1 text-gray-400" aria-hidden />
              </dd>
            </dl>
          </section>

          <section className={cardClass}>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <CrossIcon className="h-5 w-5 text-gray-500" />
              Communicant&apos;s Baptism Certificate
            </h2>
            {hasBaptismCert ? (
                <>
                  {!baptismCertExpanded ? (
                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={() => setBaptismCertExpanded(true)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        <ExpandIcon className="h-4 w-4" />
                        View certificate
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="mt-4 rounded-lg border-2 border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center h-[300px] sm:h-[320px] max-h-[40vh]">
                        {baptismCertLoading && <p className="text-gray-500 p-4">Loading certificate…</p>}
                        {baptismCertError && <p className="text-red-600 text-sm p-4">{baptismCertError}</p>}
                        {!baptismCertLoading && !baptismCertError && baptismCertUrl && (
                          baptismCertIsPdf ? (
                            <iframe
                              src={`${baptismCertUrl}#view=FitH`}
                              title="Baptism certificate"
                              className="w-full h-full min-w-0 min-h-0 border-0 rounded"
                            />
                          ) : (
                            <div className="relative w-full h-full min-h-[200px]">
                              <Image
                                src={baptismCertUrl}
                                alt="Baptism certificate"
                                fill
                                className="object-contain border-0 rounded"
                                unoptimized
                              />
                            </div>
                          )
                        )}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Link
                          href={`/baptisms/${communion.baptismId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          <ExpandIcon className="h-4 w-4" />
                          View Fullscreen
                        </Link>
                        <button
                          type="button"
                          onClick={handleDownloadBaptismCert}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          <DownloadIcon className="h-4 w-4" />
                          Download PDF
                        </button>
                      </div>
                    </>
                  )}
                </>
              ) : communion.baptismCertificatePending ? (
                <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50/50 p-4 flex gap-3">
                  <InfoIcon className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-900">Awaiting baptism proof</p>
                    <p className="mt-1 text-sm text-amber-900/90">
                      The baptism took place in another parish; the certificate has not been uploaded yet. When it is added on the baptism record, it will appear here automatically.
                    </p>
                    <Link
                      href={`/baptisms/${communion.baptismId}`}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm font-medium text-amber-950 hover:bg-amber-50"
                    >
                      <ExpandIcon className="h-4 w-4" />
                      View Baptism Record
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <p className="text-sm text-gray-700">
                    Baptism was recorded in this parish. No certificate file is on file for this communion record.
                  </p>
                  <Link
                    href={`/baptisms/${communion.baptismId}`}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <ExpandIcon className="h-4 w-4" />
                    View Baptism Record
                  </Link>
                </div>
              )}
            </section>

          <section className={cardClass}>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <NotesIcon className="h-5 w-5 text-gray-500" />
              Notes
            </h2>
            <p className="mt-1 text-sm text-gray-500">Add internal notes about this First Communion record (optional)</p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Follow-up actions, observations..."
              rows={4}
              className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-sancta-maroon focus:outline-none focus:ring-1 focus:ring-sancta-maroon"
            />
            <button
              type="button"
              onClick={handleSaveNotes}
              disabled={savingNotes}
              className="mt-3 rounded-lg bg-sancta-maroon px-4 py-2 font-medium text-white hover:bg-sancta-maroon-dark disabled:opacity-60 text-sm"
            >
              {savingNotes ? 'Saving…' : 'Save Note'}
            </button>
            {notesError && <p className="mt-2 text-sm text-red-600">{notesError}</p>}
            <div className="mt-4 border-t border-gray-100 pt-3">
              <h3 className="text-sm font-medium text-gray-800">Note History</h3>
              {noteHistoryLoading ? (
                <p className="mt-2 text-sm text-gray-500">Loading note history…</p>
              ) : noteHistory.length === 0 ? (
                <p className="mt-2 text-sm text-gray-500">No notes saved yet.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {noteHistory.map((item) => (
                    <li key={item.id} className="rounded-lg border border-gray-200 bg-gray-50 p-2">
                      <p className="text-xs text-gray-500">{formatDateTime(item.createdAt)} By {item.createdBy || 'Unknown'}</p>
                      <p className="mt-1 text-sm text-gray-800 whitespace-pre-wrap">{item.content || '—'}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <section className={cardClass} id="first-holy-communion-certificate">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <CrossIcon className="h-5 w-5 text-gray-500" />
              First Holy Communion Certificate
            </h2>
            {hasCommunionCert ? (
              <>
                <p className="mt-1 text-sm text-gray-600">
                  Original certificate received and uploaded (Communion in another church).
                </p>
                {!communionCertExpanded ? (
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => setCommunionCertExpanded(true)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <ExpandIcon className="h-4 w-4" />
                      View certificate
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="mt-4 rounded-lg border-2 border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center h-[300px] sm:h-[320px] max-h-[40vh]">
                      {communionCertLoading && <p className="text-gray-500 p-4">Loading certificate…</p>}
                      {communionCertError && <p className="text-red-600 text-sm p-4">{communionCertError}</p>}
                      {!communionCertLoading && !communionCertError && communionCertUrl && (
                        communionCertIsPdf ? (
                          <iframe
                            src={`${communionCertUrl}#view=FitH`}
                            title="First Holy Communion certificate (uploaded)"
                            className="w-full h-full min-w-0 min-h-0 border-0 rounded"
                          />
                        ) : (
                          <div className="relative w-full h-full min-h-[200px]">
                            <Image
                              src={communionCertUrl}
                              alt="First Holy Communion certificate (uploaded)"
                              fill
                              className="object-contain border-0 rounded"
                              unoptimized
                            />
                          </div>
                        )
                      )}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (communionCertUrl) window.open(communionCertUrl, '_blank', 'noopener');
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        <ExpandIcon className="h-4 w-4" />
                        View Fullscreen
                      </button>
                      <button
                        type="button"
                        onClick={handleDownloadCommunionCert}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-sancta-maroon px-3 py-2 text-sm font-medium text-white hover:bg-sancta-maroon-dark"
                      >
                        <DownloadIcon className="h-4 w-4" />
                        Download PDF
                      </button>
                    </div>
                  </>
                )}
                <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50/50 p-3 flex gap-2">
                  <InfoIcon className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-900">
                    This certificate was received from the church where First Holy Communion was celebrated. It is not editable and is stored for reference only.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="mt-4 rounded-lg border-2 border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center h-[300px] sm:h-[320px] max-h-[40vh]">
                  <iframe
                    src={`/communions/${id}/certificate?embed=1`}
                    title="First Holy Communion certificate"
                    className="w-full h-full min-w-0 min-h-0 border-0 rounded"
                  />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href={`/communions/${id}/certificate`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <ExpandIcon className="h-4 w-4" />
                    View Fullscreen
                  </Link>
                  <Link
                    href={`/communions/${id}/certificate`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-sancta-maroon px-3 py-2 text-sm font-medium text-white hover:bg-sancta-maroon-dark"
                  >
                    <DownloadIcon className="h-4 w-4" />
                    Download PDF
                  </Link>
                  <Link
                    href={`/communions/${id}/certificate`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <DownloadIcon className="h-4 w-4" />
                    Download Image
                  </Link>
                </div>
              </>
            )}
            {hasBaptismCert && !hasCommunionCert && (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50/50 p-3 flex gap-2">
                <InfoIcon className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-900">
                  Original baptism certificate received and uploaded for sacramental continuity. This certificate is not editable and is stored for reference only.
                </p>
              </div>
            )}
          </section>

          <section className={cardClass}>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FolderIcon className="h-5 w-5 text-gray-500" />
              Record Summary
            </h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div>
                <dt className="text-gray-500">Record ID</dt>
                <dd className="font-medium text-gray-900">HC/{communion.id}</dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
