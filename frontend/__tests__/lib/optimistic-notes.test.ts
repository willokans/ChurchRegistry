/**
 * Tests for optimistic note save helper.
 * Verifies immediate UI update, success path, and rollback on error.
 */
import { saveNotesOptimistically } from '@/lib/optimistic-notes';
import type { BaptismNoteResponse } from '@/lib/api';

describe('saveNotesOptimistically', () => {
  const mockUpdateNotes = jest.fn();
  const mockFetchNoteHistory = jest.fn();
  const setNotes = jest.fn();
  const setNoteHistory = jest.fn();
  const setEntity = jest.fn();
  const setNotesError = jest.fn();
  const setSavingNotes = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does nothing when notes are empty', async () => {
    await saveNotesOptimistically({
      notes: '   ',
      noteHistory: [],
      entityId: 1,
      updateNotes: mockUpdateNotes,
      fetchNoteHistory: mockFetchNoteHistory,
      setNotes,
      setNoteHistory,
      setEntity,
      setNotesError,
      setSavingNotes,
    });

    expect(mockUpdateNotes).not.toHaveBeenCalled();
    expect(setNoteHistory).not.toHaveBeenCalled();
    expect(setNotes).not.toHaveBeenCalled();
  });

  it('immediately adds optimistic entry and clears input', async () => {
    const deferred = { resolve: () => {}, reject: () => {} };
    const updatePromise = new Promise<void>((resolve, reject) => {
      deferred.resolve = () => resolve();
      deferred.reject = () => reject(new Error('abort'));
    });
    mockUpdateNotes.mockReturnValue(updatePromise);

    const promise = saveNotesOptimistically({
      notes: 'My new note',
      noteHistory: [{ id: 1, content: 'Old', createdAt: '2026-01-01T00:00:00Z', createdBy: 'user' }],
      entityId: 123,
      updateNotes: mockUpdateNotes,
      fetchNoteHistory: mockFetchNoteHistory,
      setNotes,
      setNoteHistory,
      setEntity,
      setNotesError,
      setSavingNotes,
    });

    // Before API resolves: optimistic update should have run synchronously
    expect(setNoteHistory).toHaveBeenCalledTimes(1);
    const [optimisticList] = setNoteHistory.mock.calls[0];
    expect(optimisticList).toHaveLength(2);
    expect(optimisticList[1].content).toBe('My new note');
    expect(optimisticList[1].id).toBeLessThan(0);
    expect(setNotes).toHaveBeenCalledWith('');
    expect(setNotesError).toHaveBeenCalledWith(null);
    expect(setSavingNotes).toHaveBeenCalledWith(true);

    deferred.reject();
    await promise.catch(() => {});
  });

  it('on success: replaces with server data and clears input', async () => {
    const serverHistory: BaptismNoteResponse[] = [
      { id: 1, content: 'Old', createdAt: '2026-01-01T00:00:00Z', createdBy: 'user' },
      { id: 2, content: 'My new note', createdAt: '2026-03-03T12:00:00Z', createdBy: 'admin' },
    ];
    mockUpdateNotes.mockResolvedValue({ id: 123, note: 'My new note' });
    mockFetchNoteHistory.mockResolvedValue(serverHistory);

    await saveNotesOptimistically({
      notes: 'My new note',
      noteHistory: [serverHistory[0]],
      entityId: 123,
      updateNotes: mockUpdateNotes,
      fetchNoteHistory: mockFetchNoteHistory,
      setNotes,
      setNoteHistory,
      setEntity,
      setNotesError,
      setSavingNotes,
    });

    expect(mockUpdateNotes).toHaveBeenCalledWith(123, 'My new note');
    expect(mockFetchNoteHistory).toHaveBeenCalledWith(123);
    expect(setEntity).toHaveBeenCalledWith({ id: 123, note: 'My new note' });
    expect(setNoteHistory).toHaveBeenCalledWith(serverHistory);
    expect(setNotes).toHaveBeenCalledWith('');
    expect(setSavingNotes).toHaveBeenCalledWith(false);
    expect(setNotesError).toHaveBeenCalledWith(null);
  });

  it('on error: rolls back note history and restores input', async () => {
    const prevHistory: BaptismNoteResponse[] = [
      { id: 1, content: 'Existing', createdAt: '2026-01-01T00:00:00Z', createdBy: 'user' },
    ];
    mockUpdateNotes.mockRejectedValue(new Error('Network error'));

    await saveNotesOptimistically({
      notes: 'Failed note',
      noteHistory: prevHistory,
      entityId: 456,
      updateNotes: mockUpdateNotes,
      fetchNoteHistory: mockFetchNoteHistory,
      setNotes,
      setNoteHistory,
      setEntity,
      setNotesError,
      setSavingNotes,
    });

    expect(setNoteHistory).toHaveBeenLastCalledWith(prevHistory);
    expect(setNotes).toHaveBeenLastCalledWith('Failed note');
    expect(setNotesError).toHaveBeenCalledWith('Network error');
    expect(setSavingNotes).toHaveBeenCalledWith(false);
    expect(mockFetchNoteHistory).not.toHaveBeenCalled();
    expect(setEntity).not.toHaveBeenCalled();
  });

  it('on error: uses errorFallback when error is not Error instance', async () => {
    mockUpdateNotes.mockRejectedValue('String error');

    await saveNotesOptimistically({
      notes: 'X',
      noteHistory: [],
      entityId: 1,
      updateNotes: mockUpdateNotes,
      fetchNoteHistory: mockFetchNoteHistory,
      setNotes,
      setNoteHistory,
      setEntity,
      setNotesError,
      setSavingNotes,
      errorFallback: 'Custom fallback',
    });

    expect(setNotesError).toHaveBeenCalledWith('Custom fallback');
  });
});
