/**
 * TDD: Marriage view page.
 * - When authenticated, fetches marriage by id and shows details
 * - When not found, shows not-found message
 */
import { render, screen, waitFor } from '@testing-library/react';
import { useRouter, useParams } from 'next/navigation';
import MarriageViewPage from '@/app/marriages/[id]/page';
import { getStoredToken, getStoredUser, fetchMarriage } from '@/lib/api';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}));

jest.mock('@/lib/api', () => ({
  getStoredToken: jest.fn(),
  getStoredUser: jest.fn(),
  fetchMarriage: jest.fn(),
}));

(useRouter as jest.Mock).mockReturnValue({ push: jest.fn() });

describe('Marriage view page', () => {
  beforeEach(() => {
    (getStoredToken as jest.Mock).mockReturnValue('token');
    (getStoredUser as jest.Mock).mockReturnValue({ username: 'admin', displayName: 'Admin', role: 'ADMIN' });
    (useParams as jest.Mock).mockReturnValue({ id: '3' });
    (fetchMarriage as jest.Mock).mockResolvedValue({
      id: 3,
      baptismId: 5,
      communionId: 2,
      confirmationId: 7,
      partnersName: 'John & Jane Doe',
      marriageDate: '2025-06-15',
      officiatingPriest: 'Fr. Smith',
      parish: 'St Mary',
    });
  });

  it('fetches marriage by id and shows partners name', async () => {
    render(<MarriageViewPage />);
    await waitFor(() => {
      expect(fetchMarriage).toHaveBeenCalledWith(3);
    });
    expect(screen.getByRole('main')).toHaveTextContent('John & Jane Doe');
  });

  it('shows marriage details', async () => {
    render(<MarriageViewPage />);
    await waitFor(() => {
      expect(screen.getByText(/Fr\. Smith/)).toBeInTheDocument();
    });
    expect(screen.getByText(/St Mary/)).toBeInTheDocument();
    expect(screen.getByText(/2025-06-15/)).toBeInTheDocument();
    expect(screen.getByText(/Confirmation #7|confirmation.*7/i)).toBeInTheDocument();
  });

  it('when marriage not found shows not-found message', async () => {
    (fetchMarriage as jest.Mock).mockResolvedValue(null);
    render(<MarriageViewPage />);
    await waitFor(() => {
      expect(screen.getByText(/not found/i)).toBeInTheDocument();
    });
  });
});
