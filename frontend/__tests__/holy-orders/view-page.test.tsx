/**
 * TDD: Holy Order view page.
 * - When authenticated, fetches holy order by id and shows details
 * - When not found, shows not-found message
 */
import { render, screen, waitFor } from '@testing-library/react';
import { useRouter, useParams } from 'next/navigation';
import HolyOrderViewPage from '@/app/holy-orders/[id]/page';
import { getStoredToken, getStoredUser, fetchHolyOrder } from '@/lib/api';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}));

jest.mock('@/lib/api', () => ({
  getStoredToken: jest.fn(),
  getStoredUser: jest.fn(),
  fetchHolyOrder: jest.fn(),
}));

jest.mock('@/context/ParishContext', () => ({
  useParish: () => ({
    parishId: 10,
    setParishId: jest.fn(),
    parishes: [{ id: 10, parishName: 'St Mary', dioceseId: 1 }],
    loading: false,
    error: null,
  }),
}));

(useRouter as jest.Mock).mockReturnValue({ push: jest.fn() });

describe('Holy Order view page', () => {
  beforeEach(() => {
    (getStoredToken as jest.Mock).mockReturnValue('token');
    (getStoredUser as jest.Mock).mockReturnValue({ username: 'admin', displayName: 'Admin', role: 'ADMIN' });
    (useParams as jest.Mock).mockReturnValue({ id: '4' });
    (fetchHolyOrder as jest.Mock).mockResolvedValue({
      id: 4,
      baptismId: 5,
      communionId: 2,
      confirmationId: 7,
      ordinationDate: '2025-09-01',
      orderType: 'PRIEST',
      officiatingBishop: 'Bishop Jones',
      parishId: 10,
    });
  });

  it('fetches holy order by id and shows ordination date', async () => {
    render(<HolyOrderViewPage />);
    await waitFor(() => {
      expect(fetchHolyOrder).toHaveBeenCalledWith(4);
    });
    expect(screen.getByRole('main')).toHaveTextContent('2025-09-01');
  });

  it('shows holy order details', async () => {
    render(<HolyOrderViewPage />);
    await waitFor(() => {
      expect(screen.getByText(/Bishop Jones/)).toBeInTheDocument();
    });
    expect(screen.getByRole('main')).toHaveTextContent('PRIEST');
    expect(screen.getByRole('main')).toHaveTextContent('Confirmation #7');
  });

  it('when holy order not found shows not-found message', async () => {
    (fetchHolyOrder as jest.Mock).mockResolvedValue(null);
    render(<HolyOrderViewPage />);
    await waitFor(() => {
      expect(screen.getByText(/not found/i)).toBeInTheDocument();
    });
  });
});
