import { createBaptism, createCommunion, createCommunionWithCertificate, createCommunionWithCommunionCertificate, createConfirmation, createMarriageWithParties, createHolyOrder, createBaptismWithCertificate } from '@/lib/api';
import { loadOfflineBlob } from '@/lib/offline/files';
import { getIsOnline } from '@/lib/offline/network';
import type { OfflineQueueItem, OfflineQueueFileRef, OfflineQueueItemReplayState } from '@/lib/offline/queue';
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

const STEP = {
  BAPTISM_CREATE_DONE: 'baptism_create.done',
  COMMUNION_CREATE_EXTERNAL_DONE: 'communion_create.external.done',
  COMMUNION_CREATE_THIS_CHURCH_DONE: 'communion_create.this_church.done',

  // Confirmation external baptism branch
  CONFIRMATION_EXTERNAL_BAPTISM_BAPTISM_DONE: 'confirmation.external_baptism.baptism.done',
  CONFIRMATION_EXTERNAL_BAPTISM_COMMUNION_DONE: 'confirmation.external_baptism.communion.done',
  CONFIRMATION_EXTERNAL_BAPTISM_CONFIRMATION_DONE: 'confirmation.external_baptism.confirmation.done',

  // Confirmation create communion from other church branch
  CONFIRMATION_CREATE_COMMUNION_FROM_OTHER_CHURCH_COMMUNION_DONE: 'confirmation.create_communion_from_other_church.communion.done',
  CONFIRMATION_CREATE_COMMUNION_FROM_OTHER_CHURCH_CONFIRMATION_DONE: 'confirmation.create_communion_from_other_church.confirmation.done',

  // Confirmation use existing ids branch
  CONFIRMATION_USE_EXISTING_IDS_CONFIRMATION_DONE: 'confirmation.use_existing_ids.confirmation.done',

  MARRIAGE_CREATE_DONE: 'marriage_create.done',
  HOLY_ORDER_CREATE_DONE: 'holy_order_create.done',
} as const;

function normalizeReplayState(state?: OfflineQueueItemReplayState): OfflineQueueItemReplayState {
  return {
    steps: state?.steps ? { ...state.steps } : {},
    createdBaptismId: state?.createdBaptismId,
    baptismCertificatePath: state?.baptismCertificatePath,
    createdCommunionId: state?.createdCommunionId,
    createdConfirmationId: state?.createdConfirmationId,
    createdMarriageId: state?.createdMarriageId,
    createdHolyOrderId: state?.createdHolyOrderId,
  };
}

async function executeSubmission(item: OfflineQueueItem, persistReplayState: (next: OfflineQueueItemReplayState) => Promise<void>): Promise<OfflineQueueItemReplayState> {
  const spec = item.submission;
  const payload = spec.payload as any;

  let replayState = normalizeReplayState(item.replayState);

  async function completeStep(stepKey: string, patch?: Partial<OfflineQueueItemReplayState>) {
    replayState = {
      ...replayState,
      ...(patch ?? {}),
      steps: {
        ...(replayState.steps ?? {}),
        [stepKey]: Date.now(),
      },
    };
    await persistReplayState(replayState);
  }

  if (spec.kind === 'baptism_create') {
    const done = replayState.steps?.[STEP.BAPTISM_CREATE_DONE] && typeof replayState.createdBaptismId === 'number';
    if (done) return replayState;

    const created = await createBaptism(payload.parishId, payload.body);
    await completeStep(STEP.BAPTISM_CREATE_DONE, { createdBaptismId: created.id });
    return replayState;
  }

  if (spec.kind === 'communion_create') {
    if (payload.baptismSource === 'external') {
      const done = replayState.steps?.[STEP.COMMUNION_CREATE_EXTERNAL_DONE] && typeof replayState.createdCommunionId === 'number';
      if (done) return replayState;

      const attachmentRef = payload.certificateAttachment as OfflineQueueFileRef | null;
      if (!attachmentRef?.fileRefId) throw new Error('Missing offline certificate reference.');
      const blob = await loadOfflineBlob(attachmentRef.fileRefId);
      if (!blob) throw new Error('Certificate file is not stored offline. Re-upload when online, then retry.');
      const certificateFile = blobToFile(blob, attachmentRef);
      const created = await createCommunionWithCertificate(payload.effectiveParishId, payload.communionRequest, certificateFile, payload.externalBaptism);
      await completeStep(STEP.COMMUNION_CREATE_EXTERNAL_DONE, { createdCommunionId: created.id });
      return replayState;
    }

    const done = replayState.steps?.[STEP.COMMUNION_CREATE_THIS_CHURCH_DONE] && typeof replayState.createdCommunionId === 'number';
    if (done) return replayState;

    const created = await createCommunion({
      baptismId: payload.baptismId,
      communionDate: payload.communionRequest.communionDate,
      officiatingPriest: payload.communionRequest.officiatingPriest,
      parish: payload.communionRequest.parish,
    });
    await completeStep(STEP.COMMUNION_CREATE_THIS_CHURCH_DONE, { createdCommunionId: created.id });
    return replayState;
  }

  if (spec.kind === 'confirmation_create') {
    // We store an explicit branch so replay can be deterministic after refresh.
    if (payload.branch?.type === 'external_baptism') {
      const done = replayState.steps?.[STEP.CONFIRMATION_EXTERNAL_BAPTISM_CONFIRMATION_DONE] && typeof replayState.createdConfirmationId === 'number';
      if (done) return replayState;

      const baptismDone =
        replayState.steps?.[STEP.CONFIRMATION_EXTERNAL_BAPTISM_BAPTISM_DONE] &&
        typeof replayState.createdBaptismId === 'number' &&
        typeof replayState.baptismCertificatePath === 'string';

      if (!baptismDone) {
        const baptismAttachmentRef = payload.branch.baptismCertificateAttachment as OfflineQueueFileRef | null;
        if (!baptismAttachmentRef?.fileRefId) throw new Error('Missing offline baptism certificate reference.');
        const baptismBlob = await loadOfflineBlob(baptismAttachmentRef.fileRefId);
        if (!baptismBlob) throw new Error('Baptism certificate is not stored offline. Re-upload when online, then retry.');
        const baptismCertificateFile = blobToFile(baptismBlob, baptismAttachmentRef);

        const createdBaptism = await createBaptismWithCertificate(payload.effectiveParishId, baptismCertificateFile, payload.branch.externalBaptism);
        await completeStep(STEP.CONFIRMATION_EXTERNAL_BAPTISM_BAPTISM_DONE, {
          createdBaptismId: createdBaptism.id,
          baptismCertificatePath: createdBaptism.certificatePath,
        });
      }

      if (typeof replayState.createdBaptismId !== 'number') throw new Error('Missing persisted baptism id for offline confirmation replay.');
      if (typeof replayState.baptismCertificatePath !== 'string') throw new Error('Missing persisted baptism certificate path for offline confirmation replay.');

      const communionDone = replayState.steps?.[STEP.CONFIRMATION_EXTERNAL_BAPTISM_COMMUNION_DONE] && typeof replayState.createdCommunionId === 'number';
      if (!communionDone) {
        if (payload.branch.communionSource === 'this_church') {
          const communion = await createCommunion({
            baptismId: replayState.createdBaptismId,
            communionDate: payload.externalCommunion.communionDate,
            officiatingPriest: payload.externalCommunion.officiatingPriest,
            parish: payload.effectiveParishName,
            baptismCertificatePath: replayState.baptismCertificatePath,
          });
          await completeStep(STEP.CONFIRMATION_EXTERNAL_BAPTISM_COMMUNION_DONE, { createdCommunionId: communion.id });
        } else {
          const communionAttachmentRef = payload.branch.communionCertificateAttachment as OfflineQueueFileRef | null;
          if (!communionAttachmentRef?.fileRefId) throw new Error('Missing offline Holy Communion certificate reference.');
          const communionBlob = await loadOfflineBlob(communionAttachmentRef.fileRefId);
          if (!communionBlob) throw new Error('Holy Communion certificate is not stored offline. Re-upload when online, then retry.');
          const communionCertificateFile = blobToFile(communionBlob, communionAttachmentRef);

          const communionCreated = await createCommunionWithCommunionCertificate(
            {
              baptismId: replayState.createdBaptismId,
              communionDate: payload.externalCommunion.communionDate,
              officiatingPriest: payload.externalCommunion.officiatingPriest,
              parish: payload.externalCommunion.communionChurchAddress.trim(),
            },
            communionCertificateFile,
            replayState.baptismCertificatePath
          );
          await completeStep(STEP.CONFIRMATION_EXTERNAL_BAPTISM_COMMUNION_DONE, { createdCommunionId: communionCreated.id });
        }
      }

      if (typeof replayState.createdCommunionId !== 'number') throw new Error('Missing persisted communion id for offline confirmation replay.');

      const confirmationDone =
        replayState.steps?.[STEP.CONFIRMATION_EXTERNAL_BAPTISM_CONFIRMATION_DONE] && typeof replayState.createdConfirmationId === 'number';
      if (!confirmationDone) {
        const confirmation = await createConfirmation({
          baptismId: replayState.createdBaptismId,
          communionId: replayState.createdCommunionId,
          confirmationDate: payload.form.confirmationDate,
          officiatingBishop: payload.form.officiatingBishop,
          parish: payload.form.parish || undefined,
        });
        await completeStep(STEP.CONFIRMATION_EXTERNAL_BAPTISM_CONFIRMATION_DONE, { createdConfirmationId: confirmation.id });
      }

      return replayState;
    }

    if (payload.branch?.type === 'create_communion_from_other_church') {
      const done =
        replayState.steps?.[STEP.CONFIRMATION_CREATE_COMMUNION_FROM_OTHER_CHURCH_CONFIRMATION_DONE] &&
        typeof replayState.createdConfirmationId === 'number';
      if (done) return replayState;

      const communionDone =
        replayState.steps?.[STEP.CONFIRMATION_CREATE_COMMUNION_FROM_OTHER_CHURCH_COMMUNION_DONE] && typeof replayState.createdCommunionId === 'number';
      if (!communionDone) {
        const communionAttachmentRef = payload.branch.communionCertificateAttachment as OfflineQueueFileRef | null;
        if (!communionAttachmentRef?.fileRefId) throw new Error('Missing offline Holy Communion certificate reference.');
        const communionBlob = await loadOfflineBlob(communionAttachmentRef.fileRefId);
        if (!communionBlob) throw new Error('Holy Communion certificate is not stored offline. Re-upload when online, then retry.');
        const communionCertificateFile = blobToFile(communionBlob, communionAttachmentRef);

        const createdCommunion = await createCommunionWithCommunionCertificate(
          {
            baptismId: payload.branch.selectedBaptismId,
            communionDate: payload.externalCommunion.communionDate,
            officiatingPriest: payload.externalCommunion.officiatingPriest,
            parish: payload.externalCommunion.communionChurchAddress.trim(),
          },
          communionCertificateFile
        );
        await completeStep(STEP.CONFIRMATION_CREATE_COMMUNION_FROM_OTHER_CHURCH_COMMUNION_DONE, { createdCommunionId: createdCommunion.id });
      }

      if (typeof replayState.createdCommunionId !== 'number') throw new Error('Missing persisted communion id for offline confirmation replay.');

      const confirmationDone =
        replayState.steps?.[STEP.CONFIRMATION_CREATE_COMMUNION_FROM_OTHER_CHURCH_CONFIRMATION_DONE] && typeof replayState.createdConfirmationId === 'number';
      if (!confirmationDone) {
        const confirmation = await createConfirmation({
          baptismId: payload.branch.selectedBaptismId,
          communionId: replayState.createdCommunionId,
          confirmationDate: payload.form.confirmationDate,
          officiatingBishop: payload.form.officiatingBishop,
          parish: payload.form.parish || undefined,
        });
        await completeStep(STEP.CONFIRMATION_CREATE_COMMUNION_FROM_OTHER_CHURCH_CONFIRMATION_DONE, { createdConfirmationId: confirmation.id });
      }

      return replayState;
    }

    if (payload.branch?.type === 'use_existing_ids') {
      const done =
        replayState.steps?.[STEP.CONFIRMATION_USE_EXISTING_IDS_CONFIRMATION_DONE] && typeof replayState.createdConfirmationId === 'number';
      if (done) return replayState;

      const confirmation = await createConfirmation({
        baptismId: payload.branch.baptismId,
        communionId: payload.branch.communionId,
        confirmationDate: payload.form.confirmationDate,
        officiatingBishop: payload.form.officiatingBishop,
        parish: payload.form.parish || undefined,
      });
      await completeStep(STEP.CONFIRMATION_USE_EXISTING_IDS_CONFIRMATION_DONE, { createdConfirmationId: confirmation.id });
      return replayState;
    }

    throw new Error('Unsupported confirmation branch for offline replay.');
  }

  if (spec.kind === 'marriage_create') {
    const done = replayState.steps?.[STEP.MARRIAGE_CREATE_DONE] && typeof replayState.createdMarriageId === 'number';
    if (done) return replayState;
    const created = await createMarriageWithParties(payload);
    await completeStep(STEP.MARRIAGE_CREATE_DONE, { createdMarriageId: created.id });
    return replayState;
  }

  if (spec.kind === 'holy_order_create') {
    const done = replayState.steps?.[STEP.HOLY_ORDER_CREATE_DONE] && typeof replayState.createdHolyOrderId === 'number';
    if (done) return replayState;
    const created = await createHolyOrder(payload);
    await completeStep(STEP.HOLY_ORDER_CREATE_DONE, { createdHolyOrderId: created.id });
    return replayState;
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
    const persistFn = async (nextReplayState: OfflineQueueItemReplayState) => {
      await updateOfflineQueueItemStatus(itemId, 'syncing', { replayState: nextReplayState });
    };
    const replayState = await executeSubmission(syncing, persistFn);
    await updateOfflineQueueItemStatus(itemId, 'synced');
  } catch (err) {
    const message = normalizeErrorMessage(err);
    const failedState = (await getOfflineQueueItem(itemId))?.replayState;
    await updateOfflineQueueItemStatus(itemId, 'failed', { lastError: message, replayState: failedState });
  }
}

export async function replayOfflineQueue(options?: ReplayOptions): Promise<void> {
  // Avoid concurrent replay loops.
  if (replayInFlight) {
    if (options?.onlyItemId) {
      await replayInFlight;
    } else {
      return replayInFlight;
    }
  }

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

