import { loadOfflineBlob, loadOfflineFileMeta, persistOfflineAttachmentWithGuardrails } from '@/lib/offline/files';

describe('offline attachment guardrails', () => {
  const originalIndexedDB = (globalThis as unknown as { indexedDB?: unknown }).indexedDB;

  beforeEach(() => {
    // Force localStorage fallback to keep tests deterministic.
    (globalThis as unknown as { indexedDB?: unknown }).indexedDB = undefined;
    window.localStorage.clear();
  });

  afterAll(() => {
    (globalThis as unknown as { indexedDB?: unknown }).indexedDB = originalIndexedDB;
  });

  it('defers unsupported mime types (metadata only)', async () => {
    const fileRefId = 'unit-test-guardrail-1';
    const file = new Blob(['nope'], { type: 'text/plain' });

    const res = await persistOfflineAttachmentWithGuardrails(file, {
      fileRefId,
      maxBytesPerFile: 2 * 1024 * 1024,
      maxTotalBytes: 2 * 1024 * 1024,
    });

    expect(res.storedBlob).toBe(false);
    expect(res.deferredReason).toBeTruthy();

    await expect(loadOfflineBlob(fileRefId)).resolves.toBeNull();
    const meta = await loadOfflineFileMeta(fileRefId);
    expect(meta).toEqual({ fileRefId, mimeType: 'text/plain', size: file.size });
  });

  it('defers files exceeding per-file limit (metadata only)', async () => {
    const fileRefId = 'unit-test-guardrail-2';
    const file = new Blob([new Uint8Array(1000)], { type: 'application/pdf' });

    const res = await persistOfflineAttachmentWithGuardrails(file, {
      fileRefId,
      maxBytesPerFile: 10,
      maxTotalBytes: 1000000,
    });

    expect(res.storedBlob).toBe(false);
    expect(res.deferredReason).toBeTruthy();

    await expect(loadOfflineBlob(fileRefId)).resolves.toBeNull();
    const meta = await loadOfflineFileMeta(fileRefId);
    expect(meta).toEqual({ fileRefId, mimeType: 'application/pdf', size: file.size });
  });

  it('defers when total stored blob cap is exceeded (metadata only)', async () => {
    const file1RefId = 'unit-test-guardrail-3a';
    const file2RefId = 'unit-test-guardrail-3b';
    const file1 = new Blob([new Uint8Array(800)], { type: 'application/pdf' });
    const file2 = new Blob([new Uint8Array(300)], { type: 'application/pdf' });

    const cap = 1000;

    const res1 = await persistOfflineAttachmentWithGuardrails(file1, {
      fileRefId: file1RefId,
      maxBytesPerFile: 2 * 1024 * 1024,
      maxTotalBytes: cap,
    });
    expect(res1.storedBlob).toBe(true);

    const res2 = await persistOfflineAttachmentWithGuardrails(file2, {
      fileRefId: file2RefId,
      maxBytesPerFile: 2 * 1024 * 1024,
      maxTotalBytes: cap,
    });
    expect(res2.storedBlob).toBe(false);
    expect(res2.deferredReason).toBeTruthy();

    await expect(loadOfflineBlob(file1RefId)).resolves.not.toBeNull();
    await expect(loadOfflineBlob(file2RefId)).resolves.toBeNull();
  });
});

