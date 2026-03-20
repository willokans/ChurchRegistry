'use client';

import { useEffect, useMemo, useRef } from 'react';
import { saveDraft, type OfflineDraftRecord } from '@/lib/offline/drafts';

function safeSerialize(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export type UseDebouncedDraftAutosaveOptions<TPayload> = {
  draftId: string | null;
  formType: string;
  payload: TPayload;
  /**
   * When false, the hook will not save.
   * Useful when a page hasn't established the `draftId` yet.
   */
  enabled?: boolean;
  /**
   * Wait this long after the last change before attempting a save.
   */
  debounceMs?: number;
  /**
   * Cap IndexedDB write frequency by enforcing a minimum duration between saves.
   */
  minIntervalMs?: number;
  onAutosaved?: (record: OfflineDraftRecord<TPayload>) => void;
  onAutosaveError?: (err: unknown) => void;
};

export function useDebouncedDraftAutosave<TPayload>({
  draftId,
  formType,
  payload,
  enabled = true,
  debounceMs = 2000,
  minIntervalMs = 10000,
  onAutosaved,
  onAutosaveError,
}: UseDebouncedDraftAutosaveOptions<TPayload>) {
  const latestPayloadRef = useRef(payload);
  useEffect(() => {
    latestPayloadRef.current = payload;
  }, [payload]);

  const draftIdRef = useRef(draftId);
  useEffect(() => {
    draftIdRef.current = draftId;
  }, [draftId]);

  const onAutosavedRef = useRef(onAutosaved);
  useEffect(() => {
    onAutosavedRef.current = onAutosaved;
  }, [onAutosaved]);

  const onAutosaveErrorRef = useRef(onAutosaveError);
  useEffect(() => {
    onAutosaveErrorRef.current = onAutosaveError;
  }, [onAutosaveError]);

  const enabledRef = useRef(enabled);
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  const formTypeRef = useRef(formType);
  useEffect(() => {
    formTypeRef.current = formType;
  }, [formType]);

  const serializedPayload = useMemo(() => safeSerialize(payload), [payload]);

  const lastSavedSerializedRef = useRef<string | null>(null);
  const lastSavedAtRef = useRef<number>(0);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSavingRef = useRef(false);
  const saveQueuedRef = useRef(false);

  const prevDraftIdRef = useRef<string | null>(draftId);
  useEffect(() => {
    const prevDraftId = prevDraftIdRef.current;
    if (prevDraftId !== draftId) {
      prevDraftIdRef.current = draftId;
      lastSavedSerializedRef.current = draftId ? serializedPayload : null;
      lastSavedAtRef.current = 0;
      saveQueuedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftId]);

  function computeDelayMs(now: number): number {
    const lastSavedAt = lastSavedAtRef.current;
    const hasSavedOnce = lastSavedAt > 0;
    const waitForMinInterval = hasSavedOnce ? Math.max(0, minIntervalMs - (now - lastSavedAt)) : 0;
    return Math.max(debounceMs, waitForMinInterval);
  }

  function clearTimer() {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  }

  function scheduleSave() {
    if (!draftIdRef.current || !enabledRef.current) return;

    // If already saving, don't start another write concurrently.
    if (isSavingRef.current) {
      saveQueuedRef.current = true;
      return;
    }

    clearTimer();
    const now = Date.now();
    const delay = computeDelayMs(now);

    timerRef.current = setTimeout(() => {
      void executeSave();
    }, delay);
  }

  async function executeSave() {
    const currentDraftId = draftIdRef.current;
    if (!currentDraftId || !enabledRef.current) return;

    // Another render might have caused the payload to revert.
    const latestPayload = latestPayloadRef.current;
    const payloadSerialized = safeSerialize(latestPayload);
    const lastSavedSerialized = lastSavedSerializedRef.current;
    if (lastSavedSerialized != null && payloadSerialized === lastSavedSerialized) return;

    isSavingRef.current = true;
    try {
      const payloadToSave = latestPayloadRef.current;
      await saveDraft<TPayload>(currentDraftId, formTypeRef.current, payloadToSave);

      const updatedAt = Date.now();
      lastSavedAtRef.current = updatedAt;
      lastSavedSerializedRef.current = safeSerialize(payloadToSave);

      onAutosavedRef.current?.({
        draftId: currentDraftId,
        id: currentDraftId,
        formType: formTypeRef.current,
        updatedAt,
        payload: payloadToSave,
      });
    } catch (err) {
      onAutosaveErrorRef.current?.(err);
    } finally {
      isSavingRef.current = false;

      // If new changes arrived while we were saving, schedule another pass.
      if (saveQueuedRef.current) {
        saveQueuedRef.current = false;
        const latestAfter = latestPayloadRef.current;
        const latestSerializedAfter = safeSerialize(latestAfter);
        if (lastSavedSerializedRef.current !== latestSerializedAfter) {
          scheduleSave();
        }
      }
    }
  }

  useEffect(() => {
    if (!enabled || !draftId) return;

    // On first mount for a draftId, establish the baseline and only start saving after the first change.
    if (lastSavedSerializedRef.current == null) {
      lastSavedSerializedRef.current = serializedPayload;
      return;
    }

    if (serializedPayload === lastSavedSerializedRef.current) return;
    scheduleSave();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftId, enabled, serializedPayload]);

  useEffect(() => {
    return () => {
      clearTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

