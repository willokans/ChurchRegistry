/**
 * TDD: Holy Order list page.
 * - When authenticated, fetches holy orders for parish and shows list or empty state
 * - Shows link to add new holy order
 * - When no parish available, shows message
 */
import { render, screen, waitFor, within } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import HolyOrdersPage from '@/app/holy-orders/page';
import { getStoredToken, getStoredUser, fetchHolyOrders } from '@/lib/api';
import { useParish } from '@/context/ParishContext';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/api', () => ({
  getStoredToken: jest.fn(),
  getStoredUser: jest.fn(),
  fetchHolyOrders: jest.fn(),
}));

jest.mock('@/context/ParishContext', () => ({
  useParish: jest.fn(),
}));

(useRouter as jest.Mock).mockReturnValue({ push: jest.fn() });

describe('Holy Orders list page', () => {
  beforeEach(() => {
    (getStoredToken as jest.Mock).mockReturnValue('token');
    (getStoredUser as jest.Mock).mockReturnValue({ username: 'admin', displayName: 'Admin', role: 'ADMIN' });
    (useParish as jest.Mock).mockReturnValue({
      parishId: 10,
      loading: false,
      setParishId: jest.fn(),
      parishes: [{ id: 10, parishName: 'St Mary', dioceseId: 1 }],
      error: null,
    });
    (fetchHolyOrders as jest.Mock).mockResolvedValue([]);
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
    const main = screen.getByRole('main');
    const addLinks = within(main).getAllByRole('link', { name: /add holy order/i });
    expect(addLinks.length).toBeGreaterThanOrEqual(1);
    expect(addLinks[0].getAttribute('href')).toMatch(/holy-orders\/new/);
  });

  it('when no parishes shows message and no fetch to holy orders', async () => {
    (useParish as jest.Mock).mockReturnValue({
      parishId: null,
      loading: false,
      setParishId: jest.fn(),
      parishes: [],
      error: null,
    });
    render(<HolyOrdersPage />);
    const main = screen.getByRole('main');
    await waitFor(() => {
      expect(within(main).getByText(/no parish available/i)).toBeInTheDocument();
    });
    expect(fetchHolyOrders).not.toHaveBeenCalled();
  });
});
