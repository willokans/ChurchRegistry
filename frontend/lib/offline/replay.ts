import {
  createBaptism,
  createCommunion,
  createCommunionWithCertificate,
  createCommunionWithExternalBaptismPendingProof,
  createCommunionWithCommunionCertificate,
  createConfirmation,
  createMarriageWithParties,
  createHolyOrder,
  createBaptismWithCertificate,
  fetchCommunionByBaptismId,
  fetchConfirmationByCommunionId,
  fetchMarriageByBaptismId,
  fetchMarriageByConfirmationId,
  fetchHolyOrderByConfirmationId,
} from '@/lib/api';
import { deleteOfflineBlob, loadOfflineBlob, listOfflineFiles } from '@/lib/offline/files';
import { getIsOnline } from '@/lib/offline/network';
import { detectOfflineReplayConflict, getErrorMessage, isUnauthorizedError } from '@/lib/offline/conflicts';
import type { OfflineQueueItem, OfflineQueueFileRef, OfflineQueueItemReplayState } from '@/lib/offline/queue';
import { deleteOfflineQueueItem, getOfflineQueueItem, listOfflineQueueItems, updateOfflineQueueItemStatus } from '@/lib/offline/queue';
import { deleteDraft, listDrafts } from '@/lib/offline/drafts';

type ReplayOptions = {
  onlyItemId?: string;
};

const MAX_AUTO_QUEUE_ITEMS_PER_RUN = 25;
let replayInFlight: Promise<void> | null = null;
let replayRequestedWhileInFlight = false;

function blobToFile(blob: Blob, ref: OfflineQueueFileRef): File {
  const name = ref.name ?? 'offline-attachment';
  const mimeType = ref.mimeType ?? blob.type ?? 'application/octet-stream';
  // In modern browsers `File` exists. In tests it usually exists too; if not, cast Blob as File.
  if (typeof File !== 'undefined') return new File([blob], name, { type: mimeType });
  return blob as unknown as File;
}

class AuthRequiredReplayError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthRequiredReplayError';
  }
}

class ReplayConflictError extends Error {
  conflictKind:
    | 'communion_already_exists_for_baptism'
    | 'confirmation_already_exists_for_communion'
    | 'marriage_already_exists_for_confirmation'
    | 'marriage_already_exists_for_baptism'
    | 'holy_order_already_exists_for_confirmation';

  constructor(message: string, conflictKind: ReplayConflictError['conflictKind']) {
    super(message);
    this.name = 'ReplayConflictError';
    this.conflictKind = conflictKind;
  }
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
    authRequiredAt: state?.authRequiredAt,
    conflict: state?.conflict ? { ...state.conflict } : undefined,
  };
}

function collectOfflineFileRefIds(value: unknown, out: Set<string>, depth = 0): void {
  if (depth > 20) return;
  if (!value) return;
  if (typeof value !== 'object') return;

  if (Array.isArray(value)) {
    for (const v of value) collectOfflineFileRefIds(v, out, depth + 1);
    return;
  }

  const obj = value as Record<string, unknown>;
  const maybeRefId = obj.fileRefId;
  if (typeof maybeRefId === 'string' && maybeRefId.trim()) out.add(maybeRefId);

  for (const k of Object.keys(obj)) {
    collectOfflineFileRefIds(obj[k], out, depth + 1);
  }
}

async function cleanupAfterItemSynced(item: OfflineQueueItem): Promise<void> {
  // Best-effort local cleanup: free IndexedDB/localStorage attachment storage
  // after the record has been successfully created on the server.
  try {
    const refs = new Set<string>();
    collectOfflineFileRefIds(item.submission.payload, refs);
    for (const fileRefId of Array.from(refs)) {
      await deleteOfflineBlob(fileRefId);
    }
  } catch {
    // Ignore storage cleanup failures; sync correctness is handled separately.
  }

  if (item.draftId) {
    try {
      await deleteDraft(item.draftId);
    } catch {
      // Ignore.
    }
  }
}

const FAILED_QUEUE_TTL_MS = 14 * 24 * 60 * 60 * 1000; // 14 days
const SYNCED_QUEUE_TTL_MS = 2 * 24 * 60 * 60 * 1000; // 2 days
const ORPHAN_BLOB_TTL_MS = 14 * 24 * 60 * 60 * 1000; // 14 days
const OLD_DRAFT_TTL_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

const STORAGE_HYGIENE_LAST_RUN_KEY = 'church_registry_offline_storage_hygiene_last_run';
const STORAGE_HYGIENE_MIN_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

export async function pruneOfflineResources(options?: { force?: boolean }): Promise<void> {
  // Best-effort: pruning should never block replay.
  try {
    const now = Date.now();

    const force = options?.force === true;
    if (!force && typeof localStorage !== 'undefined') {
      const lastRaw = localStorage.getItem(STORAGE_HYGIENE_LAST_RUN_KEY);
      const last = lastRaw ? Number(lastRaw) : 0;
      if (last && now - last < STORAGE_HYGIENE_MIN_INTERVAL_MS) return;
    }

    if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_HYGIENE_LAST_RUN_KEY, String(now));

    // 1) Drop stale queue items first so their file refs stop being considered "in use".
    const allQueueItems = await listOfflineQueueItems();
    const toDelete = allQueueItems.filter((i) => {
      const ageMs = now - (i.updatedAt ?? i.createdAt);
      if (i.status === 'failed') return ageMs > FAILED_QUEUE_TTL_MS;
      if (i.status === 'synced') return ageMs > SYNCED_QUEUE_TTL_MS;
      return false;
    });

    if (toDelete.length > 0) {
      await Promise.all(toDelete.map((i) => deleteOfflineQueueItem(i.id)));
    }

    // 2) Compute currently referenced fileRefIds from remaining queue items + drafts.
    const referencedFileRefIds = new Set<string>();
    const queueAfterPrune = await listOfflineQueueItems();
    for (const item of queueAfterPrune) {
      collectOfflineFileRefIds(item.submission.payload, referencedFileRefIds);
    }

    try {
      const drafts = await listDrafts();

      const staleDrafts = drafts.filter((d) => {
        const ageMs = now - (d.updatedAt ?? 0);
        return ageMs > OLD_DRAFT_TTL_MS;
      });

      // Best-effort delete; only exclude file refs from drafts that we successfully deleted.
      const deletedDraftIds = new Set<string>();
      if (staleDrafts.length > 0) {
        await Promise.all(
          staleDrafts.map(async (d) => {
            try {
              await deleteDraft(d.draftId);
              deletedDraftIds.add(d.draftId);
            } catch {
              // Ignore; we'll keep references so we don't delete blobs still needed by this draft.
            }
          })
        );
      }

      for (const draft of drafts) {
        const ageMs = now - (draft.updatedAt ?? 0);
        const isStale = ageMs > OLD_DRAFT_TTL_MS;
        if (isStale && deletedDraftIds.has(draft.draftId)) continue; // draft deleted successfully
        collectOfflineFileRefIds(draft.payload, referencedFileRefIds);
      }
    } catch {
      // Draft listing is best-effort too.
    }

    // 3) Delete orphaned blobs that are older than TTL and not referenced anywhere.
    const files = await listOfflineFiles();
    const orphanDeletes: string[] = [];
    for (const file of files) {
      if (!file.storedBlob) continue;
      if (referencedFileRefIds.has(file.fileRefId)) continue;
      const ageMs = now - (file.updatedAt ?? 0);
      if (ageMs > ORPHAN_BLOB_TTL_MS) orphanDeletes.push(file.fileRefId);
    }

    if (orphanDeletes.length > 0) {
      await Promise.all(orphanDeletes.map((id) => deleteOfflineBlob(id)));
    }
  } catch {
    // Intentionally ignore prune failures.
  }
}

async function executeSubmission(item: OfflineQueueItem, persistReplayState: (next: OfflineQueueItemReplayState) => Promise<void>): Promise<OfflineQueueItemReplayState> {
  const spec = item.submission;
  const payload = spec.payload as any;

  let replayState = normalizeReplayState(item.replayState);
  if (replayState.authRequiredAt) {
    // Clear the marker when we start trying again; actual auth validity is enforced by API calls.
    replayState = { ...replayState, authRequiredAt: undefined };
    await persistReplayState(replayState);
  }

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

      const attachmentRef = payload.certificateAttachment as OfflineQueueFileRef | null | undefined;
      let created;
      try {
        if (attachmentRef?.fileRefId) {
          const blob = await loadOfflineBlob(attachmentRef.fileRefId);
          if (!blob) throw new Error('Certificate file is not stored offline. Re-upload when online, then retry.');
          const certificateFile = blobToFile(blob, attachmentRef);
          created = await createCommunionWithCertificate(
            payload.effectiveParishId,
            payload.communionRequest,
            certificateFile,
            payload.externalBaptism
          );
        } else {
          created = await createCommunionWithExternalBaptismPendingProof(
            payload.effectiveParishId,
            payload.communionRequest,
            payload.externalBaptism
          );
        }
      } catch (err) {
        if (isUnauthorizedError(err)) {
          replayState = { ...replayState, authRequiredAt: Date.now() };
          await persistReplayState(replayState);
          throw new AuthRequiredReplayError('Unauthorized');
        }
        throw err;
      }
      await completeStep(STEP.COMMUNION_CREATE_EXTERNAL_DONE, { createdCommunionId: created.id });
      return replayState;
    }

    const done = replayState.steps?.[STEP.COMMUNION_CREATE_THIS_CHURCH_DONE] && typeof replayState.createdCommunionId === 'number';
    if (done) return replayState;

    const conflict = replayState.conflict;
    if (conflict?.stepKey === STEP.COMMUNION_CREATE_THIS_CHURCH_DONE && conflict.resolvedChoice === 'server') {
      const existing = await fetchCommunionByBaptismId(payload.baptismId);
      await completeStep(STEP.COMMUNION_CREATE_THIS_CHURCH_DONE, {
        createdCommunionId: existing.id,
        conflict: undefined,
      });
      return replayState;
    }

    let created;
    try {
      created = await createCommunion({
        baptismId: payload.baptismId,
        communionDate: payload.communionRequest.communionDate,
        officiatingPriest: payload.communionRequest.officiatingPriest,
        parish: payload.communionRequest.parish,
      });
    } catch (err) {
      if (isUnauthorizedError(err)) {
        replayState = { ...replayState, authRequiredAt: Date.now() };
        await persistReplayState(replayState);
        throw new AuthRequiredReplayError('Unauthorized');
      }

      const detected = detectOfflineReplayConflict(err);
      if (detected?.kind === 'communion_already_exists_for_baptism') {
        const nextConflict = {
          stepKey: STEP.COMMUNION_CREATE_THIS_CHURCH_DONE,
          kind: detected.kind,
          message: detected.message,
          detectedAt: Date.now(),
        };
        replayState = { ...replayState, conflict: nextConflict };
        await persistReplayState(replayState);
        throw new ReplayConflictError(detected.message, detected.kind);
      }

      throw err;
    }

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

        let createdBaptism;
        try {
          createdBaptism = await createBaptismWithCertificate(payload.effectiveParishId, baptismCertificateFile, payload.branch.externalBaptism);
        } catch (err) {
          if (isUnauthorizedError(err)) {
            replayState = { ...replayState, authRequiredAt: Date.now() };
            await persistReplayState(replayState);
            throw new AuthRequiredReplayError('Unauthorized');
          }
          throw err;
        }
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
          const conflict = replayState.conflict;
          if (
            conflict?.stepKey === STEP.CONFIRMATION_EXTERNAL_BAPTISM_COMMUNION_DONE &&
            conflict.resolvedChoice === 'server'
          ) {
            const existing = await fetchCommunionByBaptismId(replayState.createdBaptismId);
            await completeStep(STEP.CONFIRMATION_EXTERNAL_BAPTISM_COMMUNION_DONE, {
              createdCommunionId: existing.id,
              conflict: undefined,
            });
          } else {
            let communion;
            try {
              communion = await createCommunion({
                baptismId: replayState.createdBaptismId,
                communionDate: payload.externalCommunion.communionDate,
                officiatingPriest: payload.externalCommunion.officiatingPriest,
                parish: payload.effectiveParishName,
                baptismCertificatePath: replayState.baptismCertificatePath,
              });
            } catch (err) {
              if (isUnauthorizedError(err)) {
                replayState = { ...replayState, authRequiredAt: Date.now() };
                await persistReplayState(replayState);
                throw new AuthRequiredReplayError('Unauthorized');
              }

              const detected = detectOfflineReplayConflict(err);
              if (detected?.kind === 'communion_already_exists_for_baptism') {
                const nextConflict = {
                  stepKey: STEP.CONFIRMATION_EXTERNAL_BAPTISM_COMMUNION_DONE,
                  kind: detected.kind,
                  message: detected.message,
                  detectedAt: Date.now(),
                };
                replayState = { ...replayState, conflict: nextConflict };
                await persistReplayState(replayState);
                throw new ReplayConflictError(detected.message, detected.kind);
              }

              throw err;
            }

            await completeStep(STEP.CONFIRMATION_EXTERNAL_BAPTISM_COMMUNION_DONE, { createdCommunionId: communion.id });
          }
        } else {
          const communionAttachmentRef = payload.branch.communionCertificateAttachment as OfflineQueueFileRef | null;
          if (!communionAttachmentRef?.fileRefId) throw new Error('Missing offline Holy Communion certificate reference.');
          const communionBlob = await loadOfflineBlob(communionAttachmentRef.fileRefId);
          if (!communionBlob) throw new Error('Holy Communion certificate is not stored offline. Re-upload when online, then retry.');
          const communionCertificateFile = blobToFile(communionBlob, communionAttachmentRef);

          const conflict = replayState.conflict;
          if (
            conflict?.stepKey === STEP.CONFIRMATION_EXTERNAL_BAPTISM_COMMUNION_DONE &&
            conflict.resolvedChoice === 'server'
          ) {
            const existing = await fetchCommunionByBaptismId(replayState.createdBaptismId);
            await completeStep(STEP.CONFIRMATION_EXTERNAL_BAPTISM_COMMUNION_DONE, {
              createdCommunionId: existing.id,
              conflict: undefined,
            });
          } else {
            let communionCreated;
            try {
              communionCreated = await createCommunionWithCommunionCertificate(
                {
                  baptismId: replayState.createdBaptismId,
                  communionDate: payload.externalCommunion.communionDate,
                  officiatingPriest: payload.externalCommunion.officiatingPriest,
                  parish: payload.externalCommunion.communionChurchAddress.trim(),
                },
                communionCertificateFile,
                replayState.baptismCertificatePath
              );
            } catch (err) {
              if (isUnauthorizedError(err)) {
                replayState = { ...replayState, authRequiredAt: Date.now() };
                await persistReplayState(replayState);
                throw new AuthRequiredReplayError('Unauthorized');
              }

              const detected = detectOfflineReplayConflict(err);
              if (detected?.kind === 'communion_already_exists_for_baptism') {
                const nextConflict = {
                  stepKey: STEP.CONFIRMATION_EXTERNAL_BAPTISM_COMMUNION_DONE,
                  kind: detected.kind,
                  message: detected.message,
                  detectedAt: Date.now(),
                };
                replayState = { ...replayState, conflict: nextConflict };
                await persistReplayState(replayState);
                throw new ReplayConflictError(detected.message, detected.kind);
              }

              throw err;
            }

            await completeStep(STEP.CONFIRMATION_EXTERNAL_BAPTISM_COMMUNION_DONE, { createdCommunionId: communionCreated.id });
          }
        }
      }

      if (typeof replayState.createdCommunionId !== 'number') throw new Error('Missing persisted communion id for offline confirmation replay.');

      const confirmationDone =
        replayState.steps?.[STEP.CONFIRMATION_EXTERNAL_BAPTISM_CONFIRMATION_DONE] && typeof replayState.createdConfirmationId === 'number';
      if (!confirmationDone) {
        const conflict = replayState.conflict;
        if (
          conflict?.stepKey === STEP.CONFIRMATION_EXTERNAL_BAPTISM_CONFIRMATION_DONE &&
          conflict.resolvedChoice === 'server'
        ) {
          const existing = await fetchConfirmationByCommunionId(replayState.createdCommunionId);
          await completeStep(STEP.CONFIRMATION_EXTERNAL_BAPTISM_CONFIRMATION_DONE, {
            createdConfirmationId: existing.id,
            conflict: undefined,
          });
        } else {
          let confirmation;
          try {
            confirmation = await createConfirmation({
              baptismId: replayState.createdBaptismId,
              communionId: replayState.createdCommunionId,
              confirmationDate: payload.form.confirmationDate,
              officiatingBishop: payload.form.officiatingBishop,
              parish: payload.form.parish || undefined,
            });
          } catch (err) {
            if (isUnauthorizedError(err)) {
              replayState = { ...replayState, authRequiredAt: Date.now() };
              await persistReplayState(replayState);
              throw new AuthRequiredReplayError('Unauthorized');
            }

            const detected = detectOfflineReplayConflict(err);
            if (detected?.kind === 'confirmation_already_exists_for_communion') {
              const nextConflict = {
                stepKey: STEP.CONFIRMATION_EXTERNAL_BAPTISM_CONFIRMATION_DONE,
                kind: detected.kind,
                message: detected.message,
                detectedAt: Date.now(),
              };
              replayState = { ...replayState, conflict: nextConflict };
              await persistReplayState(replayState);
              throw new ReplayConflictError(detected.message, detected.kind);
            }

            throw err;
          }

          await completeStep(STEP.CONFIRMATION_EXTERNAL_BAPTISM_CONFIRMATION_DONE, { createdConfirmationId: confirmation.id });
        }
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
        const conflict = replayState.conflict;
        if (
          conflict?.stepKey === STEP.CONFIRMATION_CREATE_COMMUNION_FROM_OTHER_CHURCH_COMMUNION_DONE &&
          conflict.resolvedChoice === 'server'
        ) {
          const existing = await fetchCommunionByBaptismId(payload.branch.selectedBaptismId);
          await completeStep(STEP.CONFIRMATION_CREATE_COMMUNION_FROM_OTHER_CHURCH_COMMUNION_DONE, {
            createdCommunionId: existing.id,
            conflict: undefined,
          });
        } else {
          const communionAttachmentRef = payload.branch.communionCertificateAttachment as OfflineQueueFileRef | null;
          if (!communionAttachmentRef?.fileRefId) throw new Error('Missing offline Holy Communion certificate reference.');
          const communionBlob = await loadOfflineBlob(communionAttachmentRef.fileRefId);
          if (!communionBlob) throw new Error('Holy Communion certificate is not stored offline. Re-upload when online, then retry.');
          const communionCertificateFile = blobToFile(communionBlob, communionAttachmentRef);

          let createdCommunion;
          try {
            createdCommunion = await createCommunionWithCommunionCertificate(
              {
                baptismId: payload.branch.selectedBaptismId,
                communionDate: payload.externalCommunion.communionDate,
                officiatingPriest: payload.externalCommunion.officiatingPriest,
                parish: payload.externalCommunion.communionChurchAddress.trim(),
              },
              communionCertificateFile
            );
          } catch (err) {
            if (isUnauthorizedError(err)) {
              replayState = { ...replayState, authRequiredAt: Date.now() };
              await persistReplayState(replayState);
              throw new AuthRequiredReplayError('Unauthorized');
            }

            const detected = detectOfflineReplayConflict(err);
            if (detected?.kind === 'communion_already_exists_for_baptism') {
              const nextConflict = {
                stepKey: STEP.CONFIRMATION_CREATE_COMMUNION_FROM_OTHER_CHURCH_COMMUNION_DONE,
                kind: detected.kind,
                message: detected.message,
                detectedAt: Date.now(),
              };
              replayState = { ...replayState, conflict: nextConflict };
              await persistReplayState(replayState);
              throw new ReplayConflictError(detected.message, detected.kind);
            }

            throw err;
          }

          await completeStep(STEP.CONFIRMATION_CREATE_COMMUNION_FROM_OTHER_CHURCH_COMMUNION_DONE, { createdCommunionId: createdCommunion.id });
        }
      }

      if (typeof replayState.createdCommunionId !== 'number') throw new Error('Missing persisted communion id for offline confirmation replay.');

      const confirmationDone =
        replayState.steps?.[STEP.CONFIRMATION_CREATE_COMMUNION_FROM_OTHER_CHURCH_CONFIRMATION_DONE] && typeof replayState.createdConfirmationId === 'number';
      if (!confirmationDone) {
        const conflict = replayState.conflict;
        if (
          conflict?.stepKey === STEP.CONFIRMATION_CREATE_COMMUNION_FROM_OTHER_CHURCH_CONFIRMATION_DONE &&
          conflict.resolvedChoice === 'server'
        ) {
          const existing = await fetchConfirmationByCommunionId(replayState.createdCommunionId);
          await completeStep(STEP.CONFIRMATION_CREATE_COMMUNION_FROM_OTHER_CHURCH_CONFIRMATION_DONE, {
            createdConfirmationId: existing.id,
            conflict: undefined,
          });
        } else {
          let confirmation;
          try {
            confirmation = await createConfirmation({
              baptismId: payload.branch.selectedBaptismId,
              communionId: replayState.createdCommunionId,
              confirmationDate: payload.form.confirmationDate,
              officiatingBishop: payload.form.officiatingBishop,
              parish: payload.form.parish || undefined,
            });
          } catch (err) {
            if (isUnauthorizedError(err)) {
              replayState = { ...replayState, authRequiredAt: Date.now() };
              await persistReplayState(replayState);
              throw new AuthRequiredReplayError('Unauthorized');
            }

            const detected = detectOfflineReplayConflict(err);
            if (detected?.kind === 'confirmation_already_exists_for_communion') {
              const nextConflict = {
                stepKey: STEP.CONFIRMATION_CREATE_COMMUNION_FROM_OTHER_CHURCH_CONFIRMATION_DONE,
                kind: detected.kind,
                message: detected.message,
                detectedAt: Date.now(),
              };
              replayState = { ...replayState, conflict: nextConflict };
              await persistReplayState(replayState);
              throw new ReplayConflictError(detected.message, detected.kind);
            }

            throw err;
          }

          await completeStep(STEP.CONFIRMATION_CREATE_COMMUNION_FROM_OTHER_CHURCH_CONFIRMATION_DONE, { createdConfirmationId: confirmation.id });
        }
      }

      return replayState;
    }

    if (payload.branch?.type === 'use_existing_ids') {
      const done =
        replayState.steps?.[STEP.CONFIRMATION_USE_EXISTING_IDS_CONFIRMATION_DONE] && typeof replayState.createdConfirmationId === 'number';
      if (done) return replayState;

      const conflict = replayState.conflict;
      if (
        conflict?.stepKey === STEP.CONFIRMATION_USE_EXISTING_IDS_CONFIRMATION_DONE &&
        conflict.resolvedChoice === 'server'
      ) {
        const existing = await fetchConfirmationByCommunionId(payload.branch.communionId);
        await completeStep(STEP.CONFIRMATION_USE_EXISTING_IDS_CONFIRMATION_DONE, {
          createdConfirmationId: existing.id,
          conflict: undefined,
        });
      } else {
        let confirmation;
        try {
          confirmation = await createConfirmation({
            baptismId: payload.branch.baptismId,
            communionId: payload.branch.communionId,
            confirmationDate: payload.form.confirmationDate,
            officiatingBishop: payload.form.officiatingBishop,
            parish: payload.form.parish || undefined,
          });
        } catch (err) {
          if (isUnauthorizedError(err)) {
            replayState = { ...replayState, authRequiredAt: Date.now() };
            await persistReplayState(replayState);
            throw new AuthRequiredReplayError('Unauthorized');
          }

          const detected = detectOfflineReplayConflict(err);
          if (detected?.kind === 'confirmation_already_exists_for_communion') {
            const nextConflict = {
              stepKey: STEP.CONFIRMATION_USE_EXISTING_IDS_CONFIRMATION_DONE,
              kind: detected.kind,
              message: detected.message,
              detectedAt: Date.now(),
            };
            replayState = { ...replayState, conflict: nextConflict };
            await persistReplayState(replayState);
            throw new ReplayConflictError(detected.message, detected.kind);
          }

          throw err;
        }

        await completeStep(STEP.CONFIRMATION_USE_EXISTING_IDS_CONFIRMATION_DONE, { createdConfirmationId: confirmation.id });
      }
      return replayState;
    }

    throw new Error('Unsupported confirmation branch for offline replay.');
  }

  if (spec.kind === 'marriage_create') {
    const done = replayState.steps?.[STEP.MARRIAGE_CREATE_DONE] && typeof replayState.createdMarriageId === 'number';
    if (done) return replayState;
    const conflict = replayState.conflict;
    if (conflict?.stepKey === STEP.MARRIAGE_CREATE_DONE && conflict.resolvedChoice === 'server') {
      if (conflict.kind === 'marriage_already_exists_for_confirmation') {
        const confirmationId = payload.groom?.confirmationId ?? payload.bride?.confirmationId;
        if (typeof confirmationId !== 'number') throw new Error('Missing confirmationId for marriage conflict resolution.');
        const existing = await fetchMarriageByConfirmationId(confirmationId);
        await completeStep(STEP.MARRIAGE_CREATE_DONE, { createdMarriageId: existing.id, conflict: undefined });
      } else if (conflict.kind === 'marriage_already_exists_for_baptism') {
        const baptismId = payload.groom?.baptismId ?? payload.bride?.baptismId;
        if (typeof baptismId !== 'number') throw new Error('Missing baptismId for marriage conflict resolution.');
        const existing = await fetchMarriageByBaptismId(baptismId);
        await completeStep(STEP.MARRIAGE_CREATE_DONE, { createdMarriageId: existing.id, conflict: undefined });
      } else {
        throw new Error('Unsupported marriage conflict kind.');
      }
      return replayState;
    }

    let created;
    try {
      created = await createMarriageWithParties(payload);
    } catch (err) {
      if (isUnauthorizedError(err)) {
        replayState = { ...replayState, authRequiredAt: Date.now() };
        await persistReplayState(replayState);
        throw new AuthRequiredReplayError('Unauthorized');
      }

      const detected = detectOfflineReplayConflict(err);
      if (detected?.kind === 'marriage_already_exists_for_confirmation' || detected?.kind === 'marriage_already_exists_for_baptism') {
        const nextConflict = {
          stepKey: STEP.MARRIAGE_CREATE_DONE,
          kind: detected.kind,
          message: detected.message,
          detectedAt: Date.now(),
        };
        replayState = { ...replayState, conflict: nextConflict };
        await persistReplayState(replayState);
        throw new ReplayConflictError(detected.message, detected.kind);
      }

      throw err;
    }

    await completeStep(STEP.MARRIAGE_CREATE_DONE, { createdMarriageId: created.id });
    return replayState;
  }

  if (spec.kind === 'holy_order_create') {
    const done = replayState.steps?.[STEP.HOLY_ORDER_CREATE_DONE] && typeof replayState.createdHolyOrderId === 'number';
    if (done) return replayState;
    const conflict = replayState.conflict;
    if (conflict?.stepKey === STEP.HOLY_ORDER_CREATE_DONE && conflict.resolvedChoice === 'server') {
      if (conflict.kind !== 'holy_order_already_exists_for_confirmation') {
        throw new Error('Unsupported holy order conflict kind.');
      }
      const confirmationId = payload.confirmationId;
      if (typeof confirmationId !== 'number') throw new Error('Missing confirmationId for holy order conflict resolution.');
      const existing = await fetchHolyOrderByConfirmationId(confirmationId);
      await completeStep(STEP.HOLY_ORDER_CREATE_DONE, { createdHolyOrderId: existing.id, conflict: undefined });
      return replayState;
    }

    let created;
    try {
      created = await createHolyOrder(payload);
    } catch (err) {
      if (isUnauthorizedError(err)) {
        replayState = { ...replayState, authRequiredAt: Date.now() };
        await persistReplayState(replayState);
        throw new AuthRequiredReplayError('Unauthorized');
      }

      const detected = detectOfflineReplayConflict(err);
      if (detected?.kind === 'holy_order_already_exists_for_confirmation') {
        const nextConflict = {
          stepKey: STEP.HOLY_ORDER_CREATE_DONE,
          kind: detected.kind,
          message: detected.message,
          detectedAt: Date.now(),
        };
        replayState = { ...replayState, conflict: nextConflict };
        await persistReplayState(replayState);
        throw new ReplayConflictError(detected.message, detected.kind);
      }

      throw err;
    }

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
    await executeSubmission(syncing, persistFn);
    await updateOfflineQueueItemStatus(itemId, 'synced');
    await cleanupAfterItemSynced(syncing);
  } catch (err) {
    const failedState = (await getOfflineQueueItem(itemId))?.replayState;

    if (err instanceof AuthRequiredReplayError) {
      const authMessage = 'Session expired. Please sign in again to continue syncing offline submissions.';
      await updateOfflineQueueItemStatus(itemId, 'queued', { lastError: authMessage, replayState: failedState });
      throw err;
    }

    const message = getErrorMessage(err);
    await updateOfflineQueueItemStatus(itemId, 'failed', { lastError: message, replayState: failedState });
  }
}

export async function replayOfflineQueue(options?: ReplayOptions): Promise<void> {
  // Avoid concurrent replay loops.
  if (replayInFlight) {
    if (options?.onlyItemId) {
      await replayInFlight;
    } else {
      // Another trigger fired while we were already replaying (e.g. focus while the first
      // run started but found an empty queue). Mark a follow-up run so we don't miss work.
      replayRequestedWhileInFlight = true;
      return replayInFlight;
    }
  }

  const promise = (async () => {
    try {
      if (!getIsOnline()) return;

      if (options?.onlyItemId) {
        try {
          await runReplayForItem(options.onlyItemId);
        } catch (err) {
          if (err instanceof AuthRequiredReplayError) return;
          throw err;
        }
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
        try {
          await runReplayForItem(current.id);
        } catch (err) {
          if (err instanceof AuthRequiredReplayError) break;
          // Non-auth errors are handled within runReplayForItem.
        }
      }
    } finally {
      await pruneOfflineResources();
    }
  })();

  replayInFlight = promise;
  try {
    await promise;
  } finally {
    replayInFlight = null;
    if (replayRequestedWhileInFlight) {
      replayRequestedWhileInFlight = false;
      // Fire-and-forget; the caller already returned either `replayInFlight` or awaited `promise`.
      void replayOfflineQueue();
    } else {
      replayRequestedWhileInFlight = false;
    }
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

