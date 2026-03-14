/**
 * TDD: Holy Order list page.
 * - When authenticated, fetches holy orders for parish and shows list or empty state
 * - Add holy order button disabled (coming soon)
 * - When no parish available, shows message
 */
import { screen, waitFor, within } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import HolyOrdersPage from '@/app/holy-orders/page';
import { getStoredToken, getStoredUser, fetchHolyOrders } from '@/lib/api';
import { useParish } from '@/context/ParishContext';
import { defaultParishContext, renderWithSWR } from '../test-utils';

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
    (useParish as jest.Mock).mockReturnValue(defaultParishContext);
    (fetchHolyOrders as jest.Mock).mockResolvedValue({ content: [] });
    (fetchHolyOrders as jest.Mock).mockClear();
  });

  it('when authenticated fetches holy orders and shows list heading', async () => {
    renderWithSWR(<HolyOrdersPage />);
    await waitFor(() => {
      expect(fetchHolyOrders).toHaveBeenCalledWith(10, 0, 50);
    });
    expect(screen.getByRole('heading', { name: /holy order/i })).toBeInTheDocument();
  });

  it('shows empty state when no holy orders', async () => {
    renderWithSWR(<HolyOrdersPage />);
    await waitFor(() => {
      expect(fetchHolyOrders).toHaveBeenCalled();
    });
    expect(screen.getByText(/no holy order records|no records/i)).toBeInTheDocument();
  });

  it('shows list of holy orders when data returned', async () => {
    (fetchHolyOrders as jest.Mock).mockResolvedValue({
      content: [
        { id: 1, confirmationId: 7, ordinationDate: '2025-09-01', orderType: 'PRIEST', officiatingBishop: 'Bishop Jones' },
      ],
    });
    renderWithSWR(<HolyOrdersPage />);
    await waitFor(() => {
      expect(fetchHolyOrders).toHaveBeenCalled();
    });
    expect(screen.getByRole('main')).toHaveTextContent('2025-09-01');
    expect(screen.getByRole('main')).toHaveTextContent('PRIEST');
  });

  it('shows add holy order button disabled (coming soon)', async () => {
    renderWithSWR(<HolyOrdersPage />);
    await waitFor(() => {
      expect(fetchHolyOrders).toHaveBeenCalled();
    });
    const comingSoon = screen.getAllByText(/add holy order \(coming soon\)/i);
    expect(comingSoon.length).toBeGreaterThanOrEqual(1);
  });

  it('when no parishes shows message and no fetch to holy orders', async () => {
    (useParish as jest.Mock).mockReturnValue({
      ...defaultParishContext,
      parishId: null,
      parishes: [],
    });
    renderWithSWR(<HolyOrdersPage />);
    const main = screen.getByRole('main');
    await waitFor(() => {
      expect(within(main).getByText(/no parish available/i)).toBeInTheDocument();
    });
    expect(fetchHolyOrders).not.toHaveBeenCalled();
  });
});
