/**
 * TDD: First Holy Communion view page.
 * - When authenticated, fetches communion by id and shows details
 * - When not found, shows not-found message
 */
import { render, screen, waitFor } from '@testing-library/react';
import { useRouter, useParams } from 'next/navigation';
import CommunionViewPage from '@/app/communions/[id]/page';
import { getStoredToken, getStoredUser, fetchCommunion } from '@/lib/api';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}));

jest.mock('@/lib/api', () => ({
  getStoredToken: jest.fn(),
  getStoredUser: jest.fn(),
  fetchCommunion: jest.fn(),
}));

(useRouter as jest.Mock).mockReturnValue({ push: jest.fn() });

describe('Communion view page', () => {
  beforeEach(() => {
    (getStoredToken as jest.Mock).mockReturnValue('token');
    (getStoredUser as jest.Mock).mockReturnValue({ username: 'admin', displayName: 'Admin', role: 'ADMIN' });
    (useParams as jest.Mock).mockReturnValue({ id: '42' });
    (fetchCommunion as jest.Mock).mockResolvedValue({
      id: 42,
      baptismId: 5,
      communionDate: '2024-05-01',
      officiatingPriest: 'Fr. Smith',
      parish: 'St Mary',
    });
  });

  it('fetches communion by id and shows date', async () => {
    render(<CommunionViewPage />);
    await waitFor(() => {
      expect(fetchCommunion).toHaveBeenCalledWith(42);
    });
    expect(screen.getByRole('main')).toHaveTextContent('2024-05-01');
  });

  it('shows communion details', async () => {
    render(<CommunionViewPage />);
    await waitFor(() => {
      expect(screen.getByText(/Fr\. Smith/)).toBeInTheDocument();
    });
    expect(screen.getByText(/St Mary/)).toBeInTheDocument();
    expect(screen.getByText(/Baptism #5|baptism.*5/i)).toBeInTheDocument();
  });

  it('when communion not found shows not-found message', async () => {
    (fetchCommunion as jest.Mock).mockResolvedValue(null);
    render(<CommunionViewPage />);
    await waitFor(() => {
      expect(screen.getByText(/not found/i)).toBeInTheDocument();
    });
  });
});
