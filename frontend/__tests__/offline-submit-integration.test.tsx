import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter, useSearchParams } from 'next/navigation';
import HolyOrderCreateContent from '@/app/holy-orders/new/HolyOrderCreateContent';
import { createHolyOrder, fetchConfirmations, getStoredUser } from '@/lib/api';
import { useNetworkStatus } from '@/lib/offline/network';
import { listOfflineQueueItems } from '@/lib/offline/queue';
import { replayOfflineQueue } from '@/lib/offline/replay';

jest.mock('@/components/AuthenticatedLayout', () => ({
  __esModule: true,
  default: function AuthenticatedLayout({ children }: { children: unknown }) {
    return <>{children}</>;
  },
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock('@/lib/api', () => ({
  fetchConfirmations: jest.fn(),
  createHolyOrder: jest.fn(),
  getStoredUser: jest.fn(),
  clearAuth: jest.fn(),
}));

jest.mock('@/lib/offline/network', () => ({
  ...(jest.requireActual('@/lib/offline/network') as object),
  useNetworkStatus: jest.fn(),
}));

describe('offline submit -> queued item -> replay', () => {
  const originalIndexedDB = (globalThis as unknown as { indexedDB?: unknown }).indexedDB;
  const mockPush = jest.fn();

  beforeEach(() => {
    (globalThis as unknown as { indexedDB?: unknown }).indexedDB = undefined;
    window.localStorage.clear();
    Object.defineProperty(window.navigator, 'onLine', { configurable: true, value: true });

    mockPush.mockClear();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (useSearchParams as jest.Mock).mockReturnValue({
      get: (key: string) => {
        if (key === 'parishId') return '1';
        return null;
      },
    });

    (fetchConfirmations as jest.Mock).mockResolvedValue({
      content: [{ id: 123, confirmationDate: '2026-03-20' }],
    });

    (getStoredUser as jest.Mock).mockReturnValue(null);
    (createHolyOrder as jest.Mock).mockReset();
    (useNetworkStatus as jest.Mock).mockReturnValue({ isOnline: false });
  });

  afterAll(() => {
    (globalThis as unknown as { indexedDB?: unknown }).indexedDB = originalIndexedDB;
  });

  it('enqueues on offline submit and replays successfully', async () => {
    (createHolyOrder as jest.Mock).mockResolvedValueOnce({ id: 1 });

    render(<HolyOrderCreateContent />);

    const ordinationDateInput = await screen.findByLabelText(/ordination date/i);
    const bishopInput = screen.getByLabelText(/officiating bishop/i);
    const submitBtn = screen.getByRole('button', { name: 'Save holy order' });

    // After confirmations load, the submit button should become enabled.
    await waitFor(() => expect(submitBtn).not.toBeDisabled());

    const user = userEvent.setup();
    await user.type(ordinationDateInput, '2026-03-22');
    await user.type(bishopInput, 'Bishop X');

    await user.click(submitBtn);

    expect(await screen.findByText(/queued for sync/i)).toBeInTheDocument();

    const queued = await listOfflineQueueItems({ status: 'queued' });
    expect(queued.length).toBe(1);
    const itemId = queued[0].id;

    await replayOfflineQueue({ onlyItemId: itemId });

    // Successful sync shows the "Saved" message and navigates away.
    expect(await screen.findByText(/sync complete/i)).toBeInTheDocument();
    expect(mockPush).toHaveBeenCalledWith('/holy-orders');
    expect(createHolyOrder).toHaveBeenCalledTimes(1);
  });

  it('replays failure, shows retry UI, and succeeds on retry', async () => {
    (createHolyOrder as jest.Mock)
      .mockRejectedValueOnce(new Error('Boom'))
      .mockResolvedValueOnce({ id: 2 });

    render(<HolyOrderCreateContent />);

    const ordinationDateInput = await screen.findByLabelText(/ordination date/i);
    const bishopInput = screen.getByLabelText(/officiating bishop/i);
    const submitBtn = screen.getByRole('button', { name: 'Save holy order' });

    await waitFor(() => expect(submitBtn).not.toBeDisabled());

    const user = userEvent.setup();
    await user.type(ordinationDateInput, '2026-03-22');
    await user.type(bishopInput, 'Bishop Y');
    await user.click(submitBtn);

    const queued = await listOfflineQueueItems({ status: 'queued' });
    const itemId = queued[0].id;

    await replayOfflineQueue({ onlyItemId: itemId });

    expect(await screen.findByText(/failed to sync/i)).toBeInTheDocument();
    expect(screen.getByText('Boom')).toBeInTheDocument();

    const retryBtn = screen.getByRole('button', { name: 'Retry' });
    await user.click(retryBtn);

    await waitFor(async () => {
      // After retry, the UI should show synced state.
      expect(await screen.findByText(/sync complete/i)).toBeInTheDocument();
    });

    expect(createHolyOrder).toHaveBeenCalledTimes(2);
    expect(mockPush).toHaveBeenCalledWith('/holy-orders');
  });
});

