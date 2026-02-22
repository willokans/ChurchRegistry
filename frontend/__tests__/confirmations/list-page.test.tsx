/**
 * TDD: Confirmation list page.
 * - When authenticated, fetches confirmations for parish and shows list or empty state
 * - Shows link to add new confirmation
 * - When no parish available, shows message
 */
import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import ConfirmationsPage from '@/app/confirmations/page';
import { getStoredToken, getStoredUser, fetchDioceses, fetchParishes, fetchConfirmations } from '@/lib/api';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/api', () => ({
  getStoredToken: jest.fn(),
  getStoredUser: jest.fn(),
  fetchDioceses: jest.fn(),
  fetchParishes: jest.fn(),
  fetchConfirmations: jest.fn(),
}));

(useRouter as jest.Mock).mockReturnValue({ push: jest.fn() });

describe('Confirmations list page', () => {
  beforeEach(() => {
    (getStoredToken as jest.Mock).mockReturnValue('token');
    (getStoredUser as jest.Mock).mockReturnValue({ username: 'admin', displayName: 'Admin', role: 'ADMIN' });
    (fetchDioceses as jest.Mock).mockResolvedValue([{ id: 1, name: 'Diocese A' }]);
    (fetchParishes as jest.Mock).mockResolvedValue([{ id: 10, parishName: 'St Mary', dioceseId: 1 }]);
    (fetchConfirmations as jest.Mock).mockResolvedValue([]);
    (fetchDioceses as jest.Mock).mockClear();
    (fetchParishes as jest.Mock).mockClear();
    (fetchConfirmations as jest.Mock).mockClear();
  });

  it('when authenticated fetches confirmations and shows list heading', async () => {
    render(<ConfirmationsPage />);
    await waitFor(() => {
      expect(fetchConfirmations).toHaveBeenCalledWith(10);
    });
    expect(screen.getByRole('heading', { name: /confirmation/i })).toBeInTheDocument();
  });

  it('shows empty state when no confirmations', async () => {
    render(<ConfirmationsPage />);
    await waitFor(() => {
      expect(fetchConfirmations).toHaveBeenCalled();
    });
    expect(screen.getByText(/no confirmation records|no records/i)).toBeInTheDocument();
  });

  it('shows list of confirmations when data returned', async () => {
    (fetchConfirmations as jest.Mock).mockResolvedValue([
      { id: 1, baptismId: 5, communionId: 2, confirmationDate: '2025-04-01', officiatingBishop: 'Bishop Jones', parish: 'St Mary' },
    ]);
    render(<ConfirmationsPage />);
    await waitFor(() => {
      expect(fetchConfirmations).toHaveBeenCalled();
    });
    expect(screen.getByRole('main')).toHaveTextContent('2025-04-01');
    expect(screen.getByRole('main')).toHaveTextContent('Bishop Jones');
  });

  it('shows link to add new confirmation', async () => {
    render(<ConfirmationsPage />);
    await waitFor(() => {
      expect(fetchConfirmations).toHaveBeenCalled();
    });
    const addLink = screen.getByRole('link', { name: /add|new confirmation/i });
    expect(addLink).toBeInTheDocument();
    expect(addLink.getAttribute('href')).toMatch(/confirmations\/new/);
  });

  it('when no parishes shows message and no fetch to confirmations', async () => {
    (fetchParishes as jest.Mock).mockResolvedValue([]);
    render(<ConfirmationsPage />);
    await waitFor(() => {
      expect(screen.getByText(/no parish/i)).toBeInTheDocument();
    });
    expect(fetchConfirmations).not.toHaveBeenCalled();
  });
});
