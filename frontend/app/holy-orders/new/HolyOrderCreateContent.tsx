'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import AddRecordDesktopOnlyMessage from '@/components/AddRecordDesktopOnlyMessage';
import { fetchConfirmations, createHolyOrder, getStoredUser, type ConfirmationResponse, type HolyOrderRequest } from '@/lib/api';
import { deleteDraft, loadDraft, saveDraft, type OfflineDraftRecord } from '@/lib/offline/drafts';
import { useDebouncedDraftAutosave } from '@/lib/offline/draftAutosave';
import { useNetworkStatus } from '@/lib/offline/network';
import { enqueueOfflineSubmission } from '@/lib/offline/queue';
import { useOfflineQueueItem } from '@/lib/offline/useOfflineQueueItem';
import OfflineQueueItemStatus from '@/components/offline/OfflineQueueItemStatus';
import { deleteQueueItemAfterSync, retryOfflineQueueItem } from '@/lib/offline/replay';

export default function HolyOrderCreateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const parishIdParam = searchParams.get('parishId');
  const parishId = parishIdParam ? parseInt(parishIdParam, 10) : null;

  const [confirmations, setConfirmations] = useState<ConfirmationResponse[]>([]);
  const [loadingConfirmations, setLoadingConfirmations] = useState(!!parishId);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<HolyOrderRequest>({
    confirmationId: 0,
    ordinationDate: '',
    orderType: 'DEACON',
    officiatingBishop: '',
    parishId: undefined,
  });

  const storedUser = getStoredUser();
  const draftId =
    parishId != null && !Number.isNaN(parishId) && storedUser?.username
      ? `holy_order_create:${parishId}:${storedUser.username}`
      : null;

  const [draftRecord, setDraftRecord] = useState<OfflineDraftRecord<HolyOrderDraftPayload> | null>(null);
  const [draftStatus, setDraftStatus] = useState<string | null>(null);

  const { isOnline } = useNetworkStatus();
  const [queuedItemId, setQueuedItemId] = useState<string | null>(null);
  const queuedItem = useOfflineQueueItem(queuedItemId);

  useEffect(() => {
    if (!queuedItem || queuedItem.status !== 'synced') return;
    void deleteQueueItemAfterSync(queuedItem.id);
    if (draftId) void deleteDraft(draftId);
    router.push('/holy-orders');
  }, [queuedItem, draftId, router]);

  type HolyOrderDraftPayload = {
    form: typeof form;
  };

  useDebouncedDraftAutosave<HolyOrderDraftPayload>({
    draftId,
    formType: 'holy_order_create',
    payload: { form },
    enabled: Boolean(draftId),
    onAutosaved: (record) => {
      setDraftRecord(record);
      setDraftStatus('Draft autosaved locally.');
    },
  });

  useEffect(() => {
    if (parishId === null || Number.isNaN(parishId)) return;
    let cancelled = false;
    fetchConfirmations(parishId).then((page) => {
      if (!cancelled) {
        const list = page.content;
        setConfirmations(list);
        if (list.length > 0 && form.confirmationId === 0) setForm((f) => ({ ...f, confirmationId: list[0].id }));
      }
    }).catch(() => {
      if (!cancelled) setError('Failed to load confirmations');
    }).finally(() => {
      if (!cancelled) setLoadingConfirmations(false);
    });
    return () => { cancelled = true; };
  }, [parishId]);

  useEffect(() => {
    if (!draftId) return;
    let cancelled = false;
    setDraftStatus(null);
    loadDraft<HolyOrderDraftPayload>(draftId)
      .then((d) => {
        if (cancelled) return;
        setDraftRecord(d);
      })
      .catch(() => {
        if (cancelled) return;
        setDraftRecord(null);
      });
    return () => {
      cancelled = true;
    };
  }, [draftId]);

  if (parishId === null || Number.isNaN(parishId)) {
    return (
      <AuthenticatedLayout>
        <h1 className="text-2xl font-serif font-semibold text-sancta-maroon">New holy order</h1>
        <p className="mt-4 text-gray-600">Select a parish from the holy orders list first.</p>
        <Link href="/holy-orders" className="mt-4 inline-block text-sancta-maroon hover:underline">
          Back to holy orders
        </Link>
      </AuthenticatedLayout>
    );
  }

  async function handleSaveDraft() {
    if (!draftId) return;
    setDraftStatus('Saving draft locally…');
    try {
      const payload: HolyOrderDraftPayload = { form };
      await saveDraft<HolyOrderDraftPayload>(draftId, 'holy_order_create', payload);
      const loaded = await loadDraft<HolyOrderDraftPayload>(draftId);
      setDraftRecord(loaded);
      setDraftStatus('Draft saved locally on this device.');
    } catch {
      setDraftStatus('Failed to save draft locally.');
    }
  }

  function handleResumeDraft() {
    if (!draftRecord) return;
    setForm(draftRecord.payload.form);
    setDraftStatus('Draft loaded from this device.');
  }

  async function handleDiscardDraft() {
    if (!draftId) return;
    setDraftStatus('Discarding draft…');
    try {
      await deleteDraft(draftId);
      setDraftRecord(null);
      setDraftStatus('Draft discarded.');
    } catch {
      setDraftStatus('Failed to discard draft.');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.confirmationId <= 0) return;
    setError(null);
    setSubmitting(true);
    try {
      const request: HolyOrderRequest = {
        ...form,
        parishId: parishId != null && parishId > 0 ? parishId : undefined,
      };

      if (!isOnline) {
        const itemId = await enqueueOfflineSubmission(
          { kind: 'holy_order_create', payload: request },
          { draftId: draftId ?? undefined }
        );
        setQueuedItemId(itemId);
        return;
      }

      await createHolyOrder(request);
      router.push('/holy-orders');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create holy order');
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingConfirmations) {
    return (
      <AuthenticatedLayout>
        <p className="text-gray-600">Loading confirmations…</p>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="md:hidden space-y-4">
        <AddRecordDesktopOnlyMessage />
        <Link href="/holy-orders" className="inline-block text-sancta-maroon hover:underline">
          Back to holy orders
        </Link>
      </div>
      <div className="hidden md:block">
        <div className="mb-4">
          <Link href="/holy-orders" className="text-sancta-maroon hover:underline">
            ← Back to holy orders
          </Link>
        </div>
        <h1 className="text-2xl font-serif font-semibold text-sancta-maroon">New holy order</h1>
      {confirmations.length === 0 ? (
        <p className="mt-4 text-gray-600">No confirmations in this parish. Record a Confirmation first.</p>
      ) : (
        <>
          {draftRecord && (
            <div className="mt-6 max-w-xl rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
              <p className="text-sm font-medium">
                Draft saved locally{draftRecord.updatedAt ? ` (${new Date(draftRecord.updatedAt).toLocaleString()})` : ''}.
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleResumeDraft}
                  className="rounded-lg bg-sancta-maroon px-3 py-2 text-sm font-medium text-white hover:bg-sancta-maroon-dark"
                >
                  Resume draft
                </button>
                <button
                  type="button"
                  onClick={handleDiscardDraft}
                  className="rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm font-medium text-amber-900 hover:bg-amber-50"
                >
                  Discard
                </button>
              </div>
              <p className="mt-2 text-xs text-amber-800">Offline drafts are stored on this device until they are submitted successfully.</p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="mt-6 max-w-xl space-y-4">
            <div>
              <label htmlFor="confirmationId" className="block text-sm font-medium text-gray-700">
                Confirmation
              </label>
              <select
                id="confirmationId"
                required
                value={form.confirmationId || ''}
                onChange={(e) => setForm((f) => ({ ...f, confirmationId: parseInt(e.target.value, 10) }))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-sancta-maroon focus:outline-none focus:ring-1 focus:ring-sancta-maroon"
              >
                <option value="">Select confirmation</option>
                {confirmations.map((c) => (
                  <option key={c.id} value={c.id}>
                    Confirmation #{c.id} — {c.confirmationDate}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="ordinationDate" className="block text-sm font-medium text-gray-700">
                Ordination date
              </label>
              <input
                id="ordinationDate"
                type="date"
                required
                value={form.ordinationDate}
                onChange={(e) => setForm((f) => ({ ...f, ordinationDate: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-sancta-maroon focus:outline-none focus:ring-1 focus:ring-sancta-maroon"
              />
            </div>
            <div>
              <label htmlFor="orderType" className="block text-sm font-medium text-gray-700">
                Order type
              </label>
              <select
                id="orderType"
                required
                value={form.orderType}
                onChange={(e) => setForm((f) => ({ ...f, orderType: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-sancta-maroon focus:outline-none focus:ring-1 focus:ring-sancta-maroon"
              >
                <option value="DEACON">Deacon</option>
                <option value="PRIEST">Priest</option>
              </select>
            </div>
            <div>
              <label htmlFor="officiatingBishop" className="block text-sm font-medium text-gray-700">
                Officiating bishop
              </label>
              <input
                id="officiatingBishop"
                type="text"
                required
                value={form.officiatingBishop}
                onChange={(e) => setForm((f) => ({ ...f, officiatingBishop: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-sancta-maroon focus:outline-none focus:ring-1 focus:ring-sancta-maroon"
              />
            </div>
            {error && (
              <p role="alert" className="text-red-600 text-sm">
                {error}
              </p>
            )}
            {draftStatus && <p className="text-xs text-gray-600">{draftStatus}</p>}
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={submitting}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              Save Draft
            </button>
            <button
              type="submit"
              disabled={submitting || form.confirmationId <= 0}
              className="rounded-lg bg-sancta-maroon px-4 py-2 text-white font-medium hover:bg-sancta-maroon-dark disabled:opacity-50"
            >
              {submitting ? 'Saving…' : 'Save holy order'}
            </button>
            {queuedItem ? (
              <OfflineQueueItemStatus
                status={queuedItem.status}
                error={queuedItem.lastError}
                onRetry={queuedItem.status === 'failed' ? () => void retryOfflineQueueItem(queuedItem.id) : undefined}
              />
            ) : null}
          </form>
        </>
      )}
      </div>
    </AuthenticatedLayout>
  );
}
