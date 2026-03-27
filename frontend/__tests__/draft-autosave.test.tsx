import React from 'react';
import { act, render } from '@testing-library/react';

import { useDebouncedDraftAutosave } from '@/lib/offline/draftAutosave';
import { saveDraft } from '@/lib/offline/drafts';

jest.mock('@/lib/offline/drafts', () => ({
  saveDraft: jest.fn().mockResolvedValue(undefined),
}));

function DraftAutosaveTestComponent<TPayload>(props: {
  draftId: string | null;
  formType: string;
  payload: TPayload;
  enabled?: boolean;
  debounceMs?: number;
  minIntervalMs?: number;
}) {
  useDebouncedDraftAutosave<TPayload>({
    draftId: props.draftId,
    formType: props.formType,
    payload: props.payload,
    enabled: props.enabled ?? true,
    debounceMs: props.debounceMs,
    minIntervalMs: props.minIntervalMs,
  });

  return null;
}

describe('useDebouncedDraftAutosave', () => {
  const formType = 'unit-test_form';

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-03-20T00:00:00.000Z'));
    (saveDraft as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('debounces writes and only saves once after changes settle', async () => {
    const draftId = 'draft-1';

    const { rerender } = render(
      <DraftAutosaveTestComponent
        draftId={draftId}
        formType={formType}
        payload={{ a: 1 }}
        debounceMs={2000}
        minIntervalMs={10000}
      />
    );

    await act(async () => {
      // Let initial baseline effect run.
      await Promise.resolve();
    });

    expect(saveDraft).toHaveBeenCalledTimes(0);

    rerender(
      <DraftAutosaveTestComponent
        draftId={draftId}
        formType={formType}
        payload={{ a: 2 }}
        debounceMs={2000}
        minIntervalMs={10000}
      />
    );

    await act(async () => {
      jest.advanceTimersByTime(1999);
      await Promise.resolve();
    });
    expect(saveDraft).toHaveBeenCalledTimes(0);

    await act(async () => {
      jest.advanceTimersByTime(1);
      await Promise.resolve();
    });

    expect(saveDraft).toHaveBeenCalledTimes(1);
    expect(saveDraft).toHaveBeenLastCalledWith(draftId, formType, { a: 2 });
  });

  it('does not save again when payload is unchanged after the last successful save', async () => {
    const draftId = 'draft-2';

    const { rerender } = render(
      <DraftAutosaveTestComponent
        draftId={draftId}
        formType={formType}
        payload={{ a: 1 }}
        debounceMs={200}
        minIntervalMs={1000}
      />
    );

    await act(async () => {
      await Promise.resolve();
    });

    rerender(
      <DraftAutosaveTestComponent
        draftId={draftId}
        formType={formType}
        payload={{ a: 2 }}
        debounceMs={200}
        minIntervalMs={1000}
      />
    );

    await act(async () => {
      jest.advanceTimersByTime(200);
      await Promise.resolve();
    });

    expect(saveDraft).toHaveBeenCalledTimes(1);

    // Rerender with identical payload value.
    rerender(
      <DraftAutosaveTestComponent
        draftId={draftId}
        formType={formType}
        payload={{ a: 2 }}
        debounceMs={200}
        minIntervalMs={1000}
      />
    );

    await act(async () => {
      jest.advanceTimersByTime(500);
      await Promise.resolve();
    });

    // Still only the first save.
    expect(saveDraft).toHaveBeenCalledTimes(1);
  });

  it('respects minIntervalMs between saves', async () => {
    const draftId = 'draft-3';
    const debounceMs = 100;
    const minIntervalMs = 1000;

    const { rerender } = render(
      <DraftAutosaveTestComponent
        draftId={draftId}
        formType={formType}
        payload={{ a: 1 }}
        debounceMs={debounceMs}
        minIntervalMs={minIntervalMs}
      />
    );

    await act(async () => {
      await Promise.resolve();
    });

    // First change -> first save at t=debounceMs.
    rerender(
      <DraftAutosaveTestComponent
        draftId={draftId}
        formType={formType}
        payload={{ a: 2 }}
        debounceMs={debounceMs}
        minIntervalMs={minIntervalMs}
      />
    );

    await act(async () => {
      jest.advanceTimersByTime(debounceMs);
      await Promise.resolve();
    });

    expect(saveDraft).toHaveBeenCalledTimes(1);

    // Immediately change again (before min interval elapses).
    rerender(
      <DraftAutosaveTestComponent
        draftId={draftId}
        formType={formType}
        payload={{ a: 3 }}
        debounceMs={debounceMs}
        minIntervalMs={minIntervalMs}
      />
    );

    // Even though debounceMs has passed, minIntervalMs should delay the second write.
    await act(async () => {
      jest.advanceTimersByTime(debounceMs);
      await Promise.resolve();
    });
    expect(saveDraft).toHaveBeenCalledTimes(1);

    // Advance remaining time to exceed minIntervalMs.
    await act(async () => {
      jest.advanceTimersByTime(minIntervalMs - debounceMs + 1);
      await Promise.resolve();
    });

    expect(saveDraft).toHaveBeenCalledTimes(2);
    expect(saveDraft).toHaveBeenLastCalledWith(draftId, formType, { a: 3 });
  });
});

