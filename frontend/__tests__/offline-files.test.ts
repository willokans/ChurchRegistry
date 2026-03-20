import {
  deleteOfflineBlob,
  loadOfflineBlob,
  loadOfflineFileMeta,
  persistOfflineBlob,
} from '@/lib/offline/files';

describe('offline files module', () => {
  const originalIndexedDB = (globalThis as unknown as { indexedDB?: unknown }).indexedDB;

  beforeEach(() => {
    // Force localStorage fallback to keep tests deterministic.
    (globalThis as unknown as { indexedDB?: unknown }).indexedDB = undefined;
    window.localStorage.clear();
  });

  afterAll(() => {
    (globalThis as unknown as { indexedDB?: unknown }).indexedDB = originalIndexedDB;
  });

  it('persists/loads/deletes a PDF blob via localStorage fallback', async () => {
    const fileRefId = 'unit-test-file-1';
    const key = `church_registry_offline_file:${fileRefId}`;

    const file = new Blob(['cert content'], { type: 'application/pdf' });
    const meta = await persistOfflineBlob(file, { fileRefId, maxBytes: 2 * 1024 * 1024 });

    expect(meta).toEqual({ fileRefId, mimeType: 'application/pdf', size: file.size });
    expect(window.localStorage.getItem(key)).not.toBeNull();

    const loaded = await loadOfflineBlob(fileRefId);
    expect(loaded).not.toBeNull();
    expect(loaded!.type).toBe('application/pdf');
    expect(loaded!.size).toBe(file.size);

    const loadedMeta = await loadOfflineFileMeta(fileRefId);
    expect(loadedMeta).toEqual(meta);

    await deleteOfflineBlob(fileRefId);
    expect(window.localStorage.getItem(key)).toBeNull();
    await expect(loadOfflineBlob(fileRefId)).resolves.toBeNull();
    await expect(loadOfflineFileMeta(fileRefId)).resolves.toBeNull();
  });

  it('rejects unsupported mime types', async () => {
    const file = new Blob(['nope'], { type: 'text/plain' });
    await expect(
      persistOfflineBlob(file, { fileRefId: 'unit-test-file-bad-mime' })
    ).rejects.toThrow('Unsupported offline attachment type.');
  });

  it('rejects files exceeding maxBytes', async () => {
    const file = new Blob([new Uint8Array(11)], { type: 'application/pdf' });
    await expect(
      persistOfflineBlob(file, { fileRefId: 'unit-test-file-too-big', maxBytes: 10 })
    ).rejects.toThrow(/too large/i);
  });
});

