/**
 * TDD: Holy Order list page.
 * - When authenticated, fetches holy orders for parish and shows list or empty state
 * - Shows link to add new holy order
 * - When no parish available, shows message
 */
import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import HolyOrdersPage from '@/app/holy-orders/page';
import { getStoredToken, getStoredUser, fetchDioceses, fetchParishes, fetchHolyOrders } from '@/lib/api';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/api', () => ({
  getStoredToken: jest.fn(),
  getStoredUser: jest.fn(),
  fetchDioceses: jest.fn(),
  fetchParishes: jest.fn(),
  fetchHolyOrders: jest.fn(),
}));

(useRouter as jest.Mock).mockReturnValue({ push: jest.fn() });

describe('Holy Orders list page', () => {
  beforeEach(() => {
    (getStoredToken as jest.Mock).mockReturnValue('token');
    (getStoredUser as jest.Mock).mockReturnValue({ username: 'admin', displayName: 'Admin', role: 'ADMIN' });
    (fetchDioceses as jest.Mock).mockResolvedValue([{ id: 1, name: 'Diocese A' }]);
    (fetchParishes as jest.Mock).mockResolvedValue([{ id: 10, parishName: 'St Mary', dioceseId: 1 }]);
    (fetchHolyOrders as jest.Mock).mockResolvedValue([]);
    (fetchDioceses as jest.Mock).mockClear();
    (fetchParishes as jest.Mock).mockClear();
    (fetchHolyOrders as jest.Mock).mockClear();
  });

  it('when authenticated fetches holy orders and shows list heading', async () => {
    render(<HolyOrdersPage />);
    await waitFor(() => {
      expect(fetchHolyOrders).toHaveBeenCalledWith(10);
    });
    expect(screen.getByRole('heading', { name: /holy order/i })).toBeInTheDocument();
  });

  it('shows empty state when no holy orders', async () => {
    render(<HolyOrdersPage />);
    await waitFor(() => {
      expect(fetchHolyOrders).toHaveBeenCalled();
    });
    expect(screen.getByText(/no holy order records|no records/i)).toBeInTheDocument();
  });

  it('shows list of holy orders when data returned', async () => {
    (fetchHolyOrders as jest.Mock).mockResolvedValue([
      { id: 1, confirmationId: 7, ordinationDate: '2025-09-01', orderType: 'PRIEST', officiatingBishop: 'Bishop Jones' },
    ]);
    render(<HolyOrdersPage />);
    await waitFor(() => {
      expect(fetchHolyOrders).toHaveBeenCalled();
    });
    expect(screen.getByRole('main')).toHaveTextContent('2025-09-01');
    expect(screen.getByRole('main')).toHaveTextContent('PRIEST');
  });

  it('shows link to add new holy order', async () => {
    render(<HolyOrdersPage />);
    await waitFor(() => {
      expect(fetchHolyOrders).toHaveBeenCalled();
    });
    const addLink = screen.getByRole('link', { name: /add|new holy order/i });
    expect(addLink).toBeInTheDocument();
    expect(addLink.getAttribute('href')).toMatch(/holy-orders\/new/);
  });

  it('when no parishes shows message and no fetch to holy orders', async () => {
    (fetchParishes as jest.Mock).mockResolvedValue([]);
    render(<HolyOrdersPage />);
    await waitFor(() => {
      expect(screen.getByText(/no parish/i)).toBeInTheDocument();
    });
    expect(fetchHolyOrders).not.toHaveBeenCalled();
  });
});
