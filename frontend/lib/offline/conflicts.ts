type OfflineReplayConflictKind =
  | 'communion_already_exists_for_baptism'
  | 'confirmation_already_exists_for_communion'
  | 'marriage_already_exists_for_confirmation'
  | 'marriage_already_exists_for_baptism'
  | 'holy_order_already_exists_for_confirmation';

export type OfflineReplayConflictDetected = {
  kind: OfflineReplayConflictKind;
  message: string;
};

export function getErrorMessage(err: unknown): string {
  if (!err) return 'Sync failed.';
  if (typeof err === 'string') return err;
  if (err instanceof Error) return err.message || 'Sync failed.';
  return 'Sync failed.';
}

export function isUnauthorizedError(err: unknown): boolean {
  const message = getErrorMessage(err).toLowerCase();
  return message === 'unauthorized' || message.includes('unauthorized');
}

export function detectOfflineReplayConflict(err: unknown): OfflineReplayConflictDetected | null {
  const message = getErrorMessage(err);
  const lower = message.toLowerCase();

  // Backend uses IllegalArgumentException -> { "error": "<message>" } -> frontend throws `new Error(text)`.
  // So we match on message content.
  if (lower.includes('first holy communion already exists for this baptism')) {
    return { kind: 'communion_already_exists_for_baptism', message };
  }

  if (lower.includes('confirmation already exists for this communion')) {
    return { kind: 'confirmation_already_exists_for_communion', message };
  }

  if (lower.includes('marriage already exists for this confirmation')) {
    return { kind: 'marriage_already_exists_for_confirmation', message };
  }

  if (lower.includes('marriage already exists for this baptism record')) {
    return { kind: 'marriage_already_exists_for_baptism', message };
  }

  if (lower.includes('holy order already exists for this confirmation')) {
    return { kind: 'holy_order_already_exists_for_confirmation', message };
  }

  return null;
}

