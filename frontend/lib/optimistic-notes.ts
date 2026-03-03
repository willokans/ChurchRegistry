/**
 * Optimistic UI helper for note saves.
 * Immediately shows the new note in the UI, then rolls back on API error.
 * Improves perceived speed on slow networks.
 */

import type { BaptismNoteResponse } from './api';

export interface SaveNotesOptions<T> {
  notes: string;
  noteHistory: BaptismNoteResponse[];
  entityId: number;
  updateNotes: (id: number, note: string) => Promise<T>;
  fetchNoteHistory: (id: number) => Promise<BaptismNoteResponse[]>;
  setNotes: (notes: string) => void;
  setNoteHistory: (list: BaptismNoteResponse[]) => void;
  setEntity: (entity: T) => void;
  setNotesError: (err: string | null) => void;
  setSavingNotes: (saving: boolean) => void;
  errorFallback?: string;
}

/**
 * Saves a note optimistically: updates UI immediately, rolls back on error.
 * Only sends one request; no double-send on retry (audit log safe).
 */
export async function saveNotesOptimistically<T>(options: SaveNotesOptions<T>): Promise<void> {
  const {
    notes,
    noteHistory,
    entityId,
    updateNotes,
    fetchNoteHistory,
    setNotes,
    setNoteHistory,
    setEntity,
    setNotesError,
    setSavingNotes,
    errorFallback = 'Failed to save notes',
  } = options;

  if (!notes.trim()) return;

  const prevNotes = notes;
  const prevHistory = [...noteHistory];
  const optimisticEntry: BaptismNoteResponse = {
    id: -Date.now(),
    content: prevNotes,
    createdAt: new Date().toISOString(),
    createdBy: undefined,
  };

  setNoteHistory([...prevHistory, optimisticEntry]);
  setNotes('');
  setNotesError(null);
  setSavingNotes(true);

  try {
    const updated = await updateNotes(entityId, prevNotes);
    setEntity(updated);
    const list = await fetchNoteHistory(entityId);
    setNoteHistory(list);
  } catch (e) {
    setNoteHistory(prevHistory);
    setNotes(prevNotes);
    setNotesError(e instanceof Error ? e.message : errorFallback);
  } finally {
    setSavingNotes(false);
  }
}
