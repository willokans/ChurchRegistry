import { createBaptism, createCommunion, createCommunionWithCertificate, createCommunionWithCommunionCertificate, createConfirmation, createMarriageWithParties, createHolyOrder, createBaptismWithCertificate } from '@/lib/api';
import { loadOfflineBlob } from '@/lib/offline/files';
import { getIsOnline } from '@/lib/offline/network';
import type { OfflineQueueItem, OfflineQueueFileRef, OfflineSubmissionKind, OfflineSubmissionSpec, OfflineQueueItemStatus } from '@/lib/offline/queue';
import { deleteOfflineQueueItem, getOfflineQueueItem, listOfflineQueueItems, updateOfflineQueueItemStatus } from '@/lib/offline/queue';

type ReplayOptions = {
  onlyItemId?: string;
};

const MAX_AUTO_QUEUE_ITEMS_PER_RUN = 25;
let replayInFlight: Promise<void> | null = null;

function blobToFile(blob: Blob, ref: OfflineQueueFileRef): File {
  const name = ref.name ?? 'offline-attachment';
  const mimeType = ref.mimeType ?? blob.type ?? 'application/octet-stream';
  // In modern browsers `File` exists. In tests it usually exists too; if not, cast Blob as File.
  if (typeof File !== 'undefined') return new File([blob], name, { type: mimeType });
  return blob as unknown as File;
}

function normalizeErrorMessage(err: unknown): string {
  if (!err) return 'Sync failed.';
  if (typeof err === 'string') return err;
  if (err instanceof Error) return err.message || 'Sync failed.';
  return 'Sync failed.';
}

async function executeSubmission(item: OfflineQueueItem): Promise<void> {
  const spec = item.submission;
  const payload = spec.payload as any;

  if (spec.kind === 'baptism_create') {
    await createBaptism(payload.parishId, payload.body);
    return;
  }

  if (spec.kind === 'communion_create') {
    if (payload.baptismSource === 'external') {
      const attachmentRef = payload.certificateAttachment as OfflineQueueFileRef | null;
      if (!attachmentRef?.fileRefId) throw new Error('Missing offline certificate reference.');
      const blob = await loadOfflineBlob(attachmentRef.fileRefId);
      if (!blob) throw new Error('Certificate file is not stored offline. Re-upload when online, then retry.');
      const certificateFile = blobToFile(blob, attachmentRef);
      await createCommunionWithCertificate(payload.effectiveParishId, payload.communionRequest, certificateFile, payload.externalBaptism);
      return;
    }

    await createCommunion({
      baptismId: payload.baptismId,
      communionDate: payload.communionRequest.communionDate,
      officiatingPriest: payload.communionRequest.officiatingPriest,
      parish: payload.communionRequest.parish,
    });
    return;
  }

  if (spec.kind === 'confirmation_create') {
    // We store an explicit branch so replay can be deterministic after refresh.
    if (payload.branch?.type === 'external_baptism') {
      const baptismAttachmentRef = payload.branch.baptismCertificateAttachment as OfflineQueueFileRef | null;
      if (!baptismAttachmentRef?.fileRefId) throw new Error('Missing offline baptism certificate reference.');
      const baptismBlob = await loadOfflineBlob(baptismAttachmentRef.fileRefId);
      if (!baptismBlob) throw new Error('Baptism certificate is not stored offline. Re-upload when online, then retry.');
      const baptismCertificateFile = blobToFile(baptismBlob, baptismAttachmentRef);

      const createdBaptism = await createBaptismWithCertificate(payload.effectiveParishId, baptismCertificateFile, payload.branch.externalBaptism);

      if (payload.branch.communionSource === 'this_church') {
        const communion = await createCommunion({
          baptismId: createdBaptism.id,
          communionDate: payload.externalCommunion.communionDate,
          officiatingPriest: payload.externalCommunion.officiatingPriest,
          parish: payload.effectiveParishName,
          baptismCertificatePath: createdBaptism.certificatePath,
        });
        await createConfirmation({
          baptismId: createdBaptism.id,
          communionId: communion.id,
          confirmationDate: payload.form.confirmationDate,
          officiatingBishop: payload.form.officiatingBishop,
          parish: payload.form.parish || undefined,
        });
        return;
      }

      const communionAttachmentRef = payload.branch.communionCertificateAttachment as OfflineQueueFileRef | null;
      if (!communionAttachmentRef?.fileRefId) throw new Error('Missing offline Holy Communion certificate reference.');
      const communionBlob = await loadOfflineBlob(communionAttachmentRef.fileRefId);
      if (!communionBlob) throw new Error('Holy Communion certificate is not stored offline. Re-upload when online, then retry.');
      const communionCertificateFile = blobToFile(communionBlob, communionAttachmentRef);

      const communionCreated = await createCommunionWithCommunionCertificate(
        {
          baptismId: createdBaptism.id,
          communionDate: payload.externalCommunion.communionDate,
          officiatingPriest: payload.externalCommunion.officiatingPriest,
          parish: payload.externalCommunion.communionChurchAddress.trim(),
        },
        communionCertificateFile,
        createdBaptism.certificatePath
      );

      await createConfirmation({
        baptismId: createdBaptism.id,
        communionId: communionCreated.id,
        confirmationDate: payload.form.confirmationDate,
        officiatingBishop: payload.form.officiatingBishop,
        parish: payload.form.parish || undefined,
      });
      return;
    }

    if (payload.branch?.type === 'create_communion_from_other_church') {
      const communionAttachmentRef = payload.branch.communionCertificateAttachment as OfflineQueueFileRef | null;
      if (!communionAttachmentRef?.fileRefId) throw new Error('Missing offline Holy Communion certificate reference.');
      const communionBlob = await loadOfflineBlob(communionAttachmentRef.fileRefId);
      if (!communionBlob) throw new Error('Holy Communion certificate is not stored offline. Re-upload when online, then retry.');
      const communionCertificateFile = blobToFile(communionBlob, communionAttachmentRef);

      const created = await createCommunionWithCommunionCertificate(
        {
          baptismId: payload.branch.selectedBaptismId,
          communionDate: payload.externalCommunion.communionDate,
          officiatingPriest: payload.externalCommunion.officiatingPriest,
          parish: payload.externalCommunion.communionChurchAddress.trim(),
        },
        communionCertificateFile
      );

      await createConfirmation({
        baptismId: payload.branch.selectedBaptismId,
        communionId: created.id,
        confirmationDate: payload.form.confirmationDate,
        officiatingBishop: payload.form.officiatingBishop,
        parish: payload.form.parish || undefined,
      });
      return;
    }

    if (payload.branch?.type === 'use_existing_ids') {
      await createConfirmation({
        baptismId: payload.branch.baptismId,
        communionId: payload.branch.communionId,
        confirmationDate: payload.form.confirmationDate,
        officiatingBishop: payload.form.officiatingBishop,
        parish: payload.form.parish || undefined,
      });
      return;
    }

    throw new Error('Unsupported confirmation branch for offline replay.');
  }

  if (spec.kind === 'marriage_create') {
    await createMarriageWithParties(payload);
    return;
  }

  if (spec.kind === 'holy_order_create') {
    await createHolyOrder(payload);
    return;
  }

  throw new Error('Unsupported offline submission kind: ' + spec.kind);
}

async function runReplayForItem(itemId: string): Promise<void> {
  const item = await getOfflineQueueItem(itemId);
  if (!item) return;

  // Never replay a syncing item; UI waits for next focus/reconnect.
  if (item.status === 'syncing') return;

  if (!getIsOnline()) return;

  const syncing = await updateOfflineQueueItemStatus(itemId, 'syncing');
  if (!syncing) return;

  try {
    // Ensure we keep the item in sync if the call fails; replay will set failed status.
    await executeSubmission(syncing);
    await updateOfflineQueueItemStatus(itemId, 'synced');
  } catch (err) {
    const message = normalizeErrorMessage(err);
    await updateOfflineQueueItemStatus(itemId, 'failed', { lastError: message });
  }
}

export async function replayOfflineQueue(options?: ReplayOptions): Promise<void> {
  // Avoid concurrent replay loops.
  if (replayInFlight) return replayInFlight;

  const promise = (async () => {
    if (!getIsOnline()) return;

    if (options?.onlyItemId) {
      await runReplayForItem(options.onlyItemId);
      return;
    }

    const queued = await listOfflineQueueItems({ status: 'queued' });
    if (queued.length === 0) return;

    const ordered = [...queued].sort((a, b) => a.createdAt - b.createdAt).slice(0, MAX_AUTO_QUEUE_ITEMS_PER_RUN);
    for (const item of ordered) {
      // If the queue was cleared or item moved to another state, skip safely.
      const current = await getOfflineQueueItem(item.id);
      if (!current) continue;
      if (current.status !== 'queued') continue;
      await runReplayForItem(current.id);
    }
  })();

  replayInFlight = promise;
  try {
    await promise;
  } finally {
    replayInFlight = null;
  }
}

export async function retryOfflineQueueItem(itemId: string): Promise<void> {
  await updateOfflineQueueItemStatus(itemId, 'queued', { lastError: undefined, incrementRetry: true });
  await replayOfflineQueue({ onlyItemId: itemId });
}

export async function deleteQueueItemAfterSync(itemId: string): Promise<void> {
  const item = await getOfflineQueueItem(itemId);
  if (!item) return;
  if (item.status !== 'synced') return;
  await deleteOfflineQueueItem(itemId);
}

