import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PendingSyncOutbox from '@/components/offline/PendingSyncOutbox';
import type { OfflineQueueItem } from '@/lib/offline/queue';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/offline/network', () => ({
  useNetworkStatus: jest.fn(),
}));

jest.mock('@/lib/offline/queue', () => ({
  listOfflineQueueItems: jest.fn(),
  subscribeToOfflineQueueItemUpdates: jest.fn(),
  getOfflineQueueItem: jest.fn(),
  updateOfflineQueueItemStatus: jest.fn(),
}));

jest.mock('@/lib/offline/replay', () => ({
  replayOfflineQueue: jest.fn(),
  retryOfflineQueueItem: jest.fn(),
}));

jest.mock('@/lib/api', () => ({
  clearAuth: jest.fn(),
}));

import { useNetworkStatus } from '@/lib/offline/network';
import { getOfflineQueueItem, listOfflineQueueItems, subscribeToOfflineQueueItemUpdates, updateOfflineQueueItemStatus } from '@/lib/offline/queue';
import { replayOfflineQueue, retryOfflineQueueItem } from '@/lib/offline/replay';
import { clearAuth } from '@/lib/api';

describe('PendingSyncOutbox', () => {
  let setIntervalSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    setIntervalSpy = jest.spyOn(window, 'setInterval').mockImplementation(() => 0 as unknown as number);
    (require('next/navigation').useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (useNetworkStatus as jest.Mock).mockReturnValue({ isOnline: true });

    (subscribeToOfflineQueueItemUpdates as jest.Mock).mockImplementation(() => () => {});
  });

  afterEach(() => {
    setIntervalSpy.mockRestore();
  });

  it('renders grouped sections and conflict-resolution controls', async () => {
    const conflictItem: OfflineQueueItem = {
      id: 'conflict-item',
      createdAt: 1_700_000_000_000,
      updatedAt: 1_700_000_010_000,
      status: 'failed',
      retryCount: 1,
      lastError: 'Should not show lastError when conflict is present',
      submission: { kind: 'communion_create', payload: {} },
      replayState: {
        conflict: {
          stepKey: 'communion_create.this_church.done',
          kind: 'communion_already_exists_for_baptism',
          message: 'A communion record already exists',
          detectedAt: 1_700_000_010_000,
        },
      },
    };

    const items: OfflineQueueItem[] = [
      {
        id: 'queued-item',
        createdAt: 1_700_000_000_000,
        updatedAt: 1_700_000_000_100,
        status: 'queued',
        retryCount: 0,
        submission: { kind: 'baptism_create', payload: {} },
      },
      {
        id: 'syncing-item',
        createdAt: 1_700_000_000_200,
        updatedAt: 1_700_000_000_300,
        status: 'syncing',
        retryCount: 0,
        submission: { kind: 'holy_order_create', payload: {} },
      },
      conflictItem,
      {
        id: 'synced-item',
        createdAt: 1_700_000_000_400,
        updatedAt: 1_700_000_000_500,
        status: 'synced',
        retryCount: 0,
        submission: { kind: 'marriage_create', payload: {} },
      },
    ];

    (listOfflineQueueItems as jest.Mock).mockResolvedValue(items);

    render(<PendingSyncOutbox />);

    await waitFor(() => {
      expect(screen.getByText('Queued: 1')).toBeInTheDocument();
      expect(screen.getByText('Syncing: 1')).toBeInTheDocument();
      expect(screen.getByText('Failed: 1')).toBeInTheDocument();
      expect(screen.getByText('Synced: 1')).toBeInTheDocument();
    });

    // Conflict UI (should not show retry button for the conflict item)
    expect(screen.getByText(/Conflict requires a resolution/i)).toBeInTheDocument();
    expect(screen.getByText(/Use my local version/i)).toBeInTheDocument();
    expect(screen.getByText(/Use server version/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
    expect(screen.getByText('A communion record already exists')).toBeInTheDocument();
  });

  it('enables manual retry for failed items when online', async () => {
    const failedItem: OfflineQueueItem = {
      id: 'failed-item',
      createdAt: 1_700_000_000_000,
      updatedAt: 1_700_000_010_000,
      status: 'failed',
      retryCount: 2,
      lastError: 'Boom',
      submission: { kind: 'confirmation_create', payload: {} },
    };

    const items = [failedItem];
    (listOfflineQueueItems as jest.Mock).mockResolvedValue(items);

    (useNetworkStatus as jest.Mock).mockReturnValue({ isOnline: false });
    const { rerender } = render(<PendingSyncOutbox />);

    const retryBtn = await screen.findByRole('button', { name: 'Retry' });
    expect(retryBtn).toBeDisabled();

    await act(async () => {
      retryBtn.click();
    });
    expect(retryOfflineQueueItem).not.toHaveBeenCalled();

    // Now become online and rerender.
    (useNetworkStatus as jest.Mock).mockReturnValue({ isOnline: true });
    const user = userEvent.setup();
    rerender(<PendingSyncOutbox />);
    const retryBtnAfter = await screen.findByRole('button', { name: 'Retry' });
    await waitFor(() => {
      expect(retryBtnAfter).not.toBeDisabled();
    });
    await act(async () => {
      await user.click(retryBtnAfter);
    });

    expect(retryOfflineQueueItem).toHaveBeenCalledWith('failed-item');
  });

  it('calls replay with specific item after conflict resolution', async () => {
    const itemId = 'conflict-item-2';
    const conflict = {
      stepKey: 'marriage_create.done',
      kind: 'marriage_already_exists_for_baptism',
      message: 'Marriage already exists',
      detectedAt: 1_700_000_010_000,
    };

    const items: OfflineQueueItem[] = [
      {
        id: itemId,
        createdAt: 1_700_000_000_000,
        updatedAt: 1_700_000_010_000,
        status: 'failed',
        retryCount: 0,
        lastError: 'not used',
        submission: { kind: 'marriage_create', payload: {} },
        replayState: { conflict },
      },
    ];

    (listOfflineQueueItems as jest.Mock).mockResolvedValue(items);

    (getOfflineQueueItem as jest.Mock).mockResolvedValueOnce(items[0]);
    (updateOfflineQueueItemStatus as jest.Mock).mockResolvedValueOnce(items[0]);

    render(<PendingSyncOutbox />);

    const serverBtn = await screen.findByRole('button', { name: 'Use server version' });

    await act(async () => {
      serverBtn.click();
    });

    expect(updateOfflineQueueItemStatus).toHaveBeenCalledWith(
      itemId,
      'queued',
      expect.objectContaining({
        lastError: undefined,
        replayState: expect.objectContaining({
          conflict: expect.objectContaining({
            resolvedChoice: 'server',
          }),
        }),
      })
    );
    expect(replayOfflineQueue).toHaveBeenCalledWith({ onlyItemId: itemId });
  });

  it('shows auth-required UI and triggers sign-in flow', async () => {
    const authItem: OfflineQueueItem = {
      id: 'auth-item',
      createdAt: 1_700_000_000_000,
      updatedAt: 1_700_000_010_000,
      status: 'queued',
      retryCount: 0,
      lastError: 'Session expired. Please sign in again to continue syncing offline submissions.',
      submission: { kind: 'holy_order_create', payload: {} },
      replayState: {
        authRequiredAt: 1_700_000_010_000,
      },
    };

    (listOfflineQueueItems as jest.Mock).mockResolvedValue([authItem]);

    render(<PendingSyncOutbox />);

    expect(await screen.findByText('Session expired')).toBeInTheDocument();
    const btn = await screen.findByRole('button', { name: 'Sign in again' });

    await act(async () => {
      btn.click();
    });

    expect(clearAuth).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith('/login');
  });
});

