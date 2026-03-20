import { listOfflineFiles } from '@/lib/offline/files';
import { DEFAULT_MAX_OFFLINE_TOTAL_BYTES } from '@/lib/offline/files';
import { listOfflineQueueItems } from '@/lib/offline/queue';

export type OfflineStorageUsageEstimate = {
  blobsBytes: number; // stored blobs only (not deferred metadata-only entries)
  queueBytes: number; // approximate JSON size of queue records
  usedBytes: number; // blobs + queue
  maxBytes: number; // local cap for offline attachments
  queueCount: number;
  failedQueueCount: number;
};

const encoder = typeof TextEncoder !== 'undefined' ? new TextEncoder() : null;

function approxJsonBytes(value: unknown): number {
  try {
    const json = JSON.stringify(value);
    if (!encoder) return json.length;
    return encoder.encode(json).byteLength;
  } catch {
    // Fallback for circular/non-serializable objects.
    try {
      return typeof value === 'string' ? value.length : 0;
    } catch {
      return 0;
    }
  }
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let idx = 0;
  let value = bytes;
  while (value >= 1024 && idx < units.length - 1) {
    value /= 1024;
    idx++;
  }
  const precision = idx === 0 ? 0 : idx === 1 ? 1 : 2;
  return `${value.toFixed(precision)} ${units[idx]}`;
}

export const OFFLINE_STORAGE_WARNING_RATIO = 0.85;

export function isNearOfflineStorageCap(estimate: OfflineStorageUsageEstimate, threshold = OFFLINE_STORAGE_WARNING_RATIO): boolean {
  if (!estimate.maxBytes) return false;
  const usedRatio = estimate.usedBytes / estimate.maxBytes;
  const blobRatio = estimate.blobsBytes / estimate.maxBytes;
  return usedRatio >= threshold || blobRatio >= threshold;
}

export async function estimateOfflineStorageUsage(): Promise<OfflineStorageUsageEstimate> {
  // Best-effort: estimation should never throw and should never block the UI.
  try {
    const [files, queueItems] = await Promise.all([listOfflineFiles(), listOfflineQueueItems()]);

    const blobsBytes = files.reduce((sum, f) => sum + (f.storedBlob ? f.size : 0), 0);
    const queueBytes = queueItems.reduce((sum, item) => sum + approxJsonBytes(item), 0);

    return {
      blobsBytes,
      queueBytes,
      usedBytes: blobsBytes + queueBytes,
      maxBytes: DEFAULT_MAX_OFFLINE_TOTAL_BYTES,
      queueCount: queueItems.length,
      failedQueueCount: queueItems.filter((i) => i.status === 'failed').length,
    };
  } catch {
    return {
      blobsBytes: 0,
      queueBytes: 0,
      usedBytes: 0,
      maxBytes: DEFAULT_MAX_OFFLINE_TOTAL_BYTES,
      queueCount: 0,
      failedQueueCount: 0,
    };
  }
}

