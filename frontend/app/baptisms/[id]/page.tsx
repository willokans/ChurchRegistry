'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { fetchBaptism, updateBaptismNotes, emailBaptismCertificate, fetchBaptismNoteHistory, type BaptismResponse, type BaptismNoteResponse } from '@/lib/api';

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

export default function BaptismViewPage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? parseInt(params.id, 10) : NaN;
  const [baptism, setBaptism] = useState<BaptismResponse | null | undefined>(undefined);
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [noteHistory, setNoteHistory] = useState<BaptismNoteResponse[]>([]);
  const [noteHistoryLoading, setNoteHistoryLoading] = useState(false);

  useEffect(() => {
    if (Number.isNaN(id)) {
      setBaptism(null);
      return;
    }
    let cancelled = false;
    fetchBaptism(id).then((b) => {
      if (!cancelled) {
        setBaptism(b ?? null);
        if (b?.note != null) setNotes(b.note);
      }
    }).catch(() => {
      if (!cancelled) setBaptism(null);
    });
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    if (baptism == null || Number.isNaN(id)) {
      setNoteHistory([]);
      return;
    }
    let cancelled = false;
    setNoteHistoryLoading(true);
    fetchBaptismNoteHistory(id).then((list) => {
      if (!cancelled) setNoteHistory(list);
    }).catch(() => {
      if (!cancelled) setNoteHistory([]);
    }).finally(() => {
      if (!cancelled) setNoteHistoryLoading(false);
    });
    return () => { cancelled = true; };
  }, [id, baptism?.id]);

  async function handleSaveNotes() {
    if (baptism == null) return;
    setNotesError(null);
    setSavingNotes(true);
    try {
      const updated = await updateBaptismNotes(baptism.id, notes);
      setBaptism(updated);
      const list = await fetchBaptismNoteHistory(baptism.id);
      setNoteHistory(list);
    } catch (e) {
      setNotesError(e instanceof Error ? e.message : 'Failed to save notes');
    } finally {
      setSavingNotes(false);
    }
  }

  function openEmailModal() {
    setEmailModalOpen(true);
    setEmailTo('');
    setEmailError(null);
    setEmailSuccess(false);
  }

  function closeEmailModal() {
    setEmailModalOpen(false);
    setEmailTo('');
    setEmailError(null);
    setEmailSuccess(false);
  }

  async function handleEmailCertificate() {
    if (baptism == null || !emailTo.trim()) return;
    setEmailError(null);
    setEmailSending(true);
    try {
      await emailBaptismCertificate(baptism.id, emailTo.trim());
      setEmailSuccess(true);
      setTimeout(closeEmailModal, 2000);
    } catch (e) {
      setEmailError(e instanceof Error ? e.message : 'Failed to send certificate');
    } finally {
      setEmailSending(false);
    }
  }

  if (Number.isNaN(id)) {
    return (
      <AuthenticatedLayout>
        <p className="text-red-600">Invalid baptism id.</p>
      </AuthenticatedLayout>
    );
  }

  if (baptism === undefined) {
    return (
      <AuthenticatedLayout>
        <p className="text-gray-600">Loading…</p>
      </AuthenticatedLayout>
    );
  }

  if (baptism === null) {
    return (
      <AuthenticatedLayout>
        <h1 className="text-2xl font-serif font-semibold text-sancta-maroon">Baptism</h1>
        <p className="mt-4 text-gray-600">Baptism record not found.</p>
        <Link href="/baptisms" className="mt-4 inline-block text-sancta-maroon hover:underline">
          Back to baptisms
        </Link>
      </AuthenticatedLayout>
    );
  }

  const displayName = `${baptism.baptismName}${baptism.otherNames ? ` ${baptism.otherNames}` : ''} ${baptism.surname}`.trim();
  const parentAddress = baptism.parentAddress ?? baptism.address ?? '';

  return (
    <AuthenticatedLayout>
      <div className="mb-4">
        <Link href="/baptisms" className="text-gray-500 hover:text-gray-700 hover:underline">
          ← Back to Baptisms
        </Link>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <h1 className="text-2xl font-serif font-semibold text-sancta-maroon">
          {displayName}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/baptisms/${id}/certificate`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-sancta-maroon bg-white px-3 py-2 text-sm font-medium text-sancta-maroon hover:bg-sancta-maroon/5"
          >
            <PrinterIcon className="h-4 w-4" />
            Print Certificate
          </Link>
          <button
            type="button"
            onClick={openEmailModal}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <EmailIcon className="h-4 w-4" />
            Email Baptism Certificate
          </button>
        </div>
      </div>

      {emailModalOpen && (
        <EmailCertificateModal
          emailTo={emailTo}
          setEmailTo={setEmailTo}
          sending={emailSending}
          error={emailError}
          success={emailSuccess}
          onSend={handleEmailCertificate}
          onClose={closeEmailModal}
        />
      )}

      <section className="mt-8 rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="sr-only">Baptism details</h2>
        <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-[auto_1fr]">
          <DetailRow label="Baptism Name" value={baptism.baptismName || '—'} />
          <DetailRow label="Other Names" value={baptism.otherNames || '—'} />
          <DetailRow label="Date of Birth" value={formatDisplayDate(baptism.dateOfBirth)} />
          <DetailRow label="Gender" value={baptism.gender} />
          <DetailRow label="Father" value={baptism.fathersName} />
          <DetailRow label="Mother" value={baptism.mothersName} />
          <DetailRow label="Sponsors" value={baptism.sponsorNames} />
          <DetailRow label="Officiating Priest" value={baptism.officiatingPriest || '—'} />
          <DetailRow label="Parents' Address" value={parentAddress || '—'} />
        </dl>
      </section>

      <section className="mt-8 rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Notes</h2>
        <p className="mt-1 text-sm text-gray-500">Add any additional notes for this record.</p>
        <textarea
          id="baptism-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any additional notes here..."
          rows={4}
          className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-sancta-maroon focus:outline-none focus:ring-1 focus:ring-sancta-maroon"
        />
        {notesError && (
          <p role="alert" className="mt-2 text-sm text-red-600">
            {notesError}
          </p>
        )}
        <button
          type="button"
          onClick={handleSaveNotes}
          disabled={savingNotes}
          className="mt-3 rounded-lg bg-sancta-maroon px-4 py-2 font-medium text-white hover:bg-sancta-maroon-dark disabled:opacity-50"
        >
          {savingNotes ? 'Saving…' : 'Save Notes'}
        </button>
      </section>

      <section className="mt-8 rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Note history</h2>
        <p className="mt-1 text-sm text-gray-500">All saved notes for this record, newest first.</p>
        {noteHistoryLoading ? (
          <p className="mt-3 text-sm text-gray-500">Loading…</p>
        ) : noteHistory.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">No notes saved yet.</p>
        ) : (
          <ul className="mt-3 space-y-4" role="list">
            {noteHistory.map((entry) => (
              <li key={entry.id} className="border-l-2 border-gray-200 pl-4">
                <p className="text-xs font-medium text-gray-500">{formatDateTime(entry.createdAt)}</p>
                <p className="mt-0.5 text-sm text-gray-900 whitespace-pre-wrap">{entry.content}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AuthenticatedLayout>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-sm font-medium text-gray-700">{label}</dt>
      <dd className="text-gray-900">{value}</dd>
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

function EmailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function EmailCertificateModal({
  emailTo,
  setEmailTo,
  sending,
  error,
  success,
  onSend,
  onClose,
}: {
  emailTo: string;
  setEmailTo: (v: string) => void;
  sending: boolean;
  error: string | null;
  success: boolean;
  onSend: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" aria-hidden onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="email-certificate-title"
        className="relative w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-lg"
      >
        <h2 id="email-certificate-title" className="text-lg font-semibold text-gray-900">
          Email Baptism Certificate
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Enter the recipient&apos;s email address. A PDF certificate will be sent as an attachment.
        </p>
        <label htmlFor="email-certificate-to" className="mt-4 block text-sm font-medium text-gray-700">
          Recipient email
        </label>
        <input
          id="email-certificate-to"
          type="email"
          value={emailTo}
          onChange={(e) => setEmailTo(e.target.value)}
          placeholder="e.g. recipient@example.com"
          disabled={sending || success}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-sancta-maroon focus:outline-none focus:ring-1 focus:ring-sancta-maroon disabled:opacity-60"
        />
        {error && (
          <p role="alert" className="mt-2 text-sm text-red-600">
            {error}
          </p>
        )}
        {success && (
          <p className="mt-2 text-sm text-green-600">
            Certificate sent successfully. This dialog will close shortly.
          </p>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={sending}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSend}
            disabled={sending || success || !emailTo.trim()}
            className="rounded-lg bg-sancta-maroon px-4 py-2 text-sm font-medium text-white hover:bg-sancta-maroon-dark disabled:opacity-50"
          >
            {sending ? 'Sending…' : success ? 'Sent' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}

