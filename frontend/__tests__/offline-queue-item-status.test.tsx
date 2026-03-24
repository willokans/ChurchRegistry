import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OfflineQueueItemStatus from '@/components/offline/OfflineQueueItemStatus';

describe('OfflineQueueItemStatus', () => {
  it('renders queued state', () => {
    render(<OfflineQueueItemStatus status="queued" />);
    expect(screen.getByText(/queued for sync/i)).toBeInTheDocument();
  });

  it('renders syncing state', () => {
    render(<OfflineQueueItemStatus status="syncing" />);
    expect(screen.getByText(/syncing/i)).toBeInTheDocument();
  });

  it('renders synced state', () => {
    render(<OfflineQueueItemStatus status="synced" />);
    expect(screen.getByText(/sync complete/i)).toBeInTheDocument();
  });

  it('renders failed state with error and retry callback', async () => {
    const onRetry = jest.fn();
    render(<OfflineQueueItemStatus status="failed" error="Boom" onRetry={onRetry} />);

    expect(screen.getByText(/failed to sync/i)).toBeInTheDocument();
    expect(screen.getByText('Boom')).toBeInTheDocument();

    const retryBtn = screen.getByRole('button', { name: 'Retry' });
    expect(retryBtn).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(retryBtn);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});

