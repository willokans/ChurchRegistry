/**
 * TDD: Marriage (Holy Matrimony) list page.
 * - When authenticated, fetches marriages for parish and shows list or empty state
 * - Shows link to add new marriage
 * - When no parish available, shows message
 */
import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import MarriagesPage from '@/app/marriages/page';
import { getStoredToken, getStoredUser, fetchMarriages } from '@/lib/api';
import { useParish } from '@/context/ParishContext';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/api', () => ({
  getStoredToken: jest.fn(),
  getStoredUser: jest.fn(),
  fetchMarriages: jest.fn(),
}));

jest.mock('@/context/ParishContext', () => ({
  useParish: jest.fn(),
}));

(useRouter as jest.Mock).mockReturnValue({ push: jest.fn() });

describe('Marriages list page', () => {
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
    (fetchMarriages as jest.Mock).mockResolvedValue([]);
    (fetchMarriages as jest.Mock).mockClear();
  });

  it('when authenticated fetches marriages and shows list heading', async () => {
    render(<MarriagesPage />);
    await waitFor(() => {
      expect(fetchMarriages).toHaveBeenCalledWith(10);
    });
    expect(screen.getByRole('heading', { name: /marriage|holy matrimony|matrimony/i })).toBeInTheDocument();
  });

  it('shows empty state when no marriages', async () => {
    render(<MarriagesPage />);
    await waitFor(() => {
      expect(fetchMarriages).toHaveBeenCalled();
    });
    expect(screen.getByText(/no marriage records|no records/i)).toBeInTheDocument();
  });

  it('shows list of marriages when data returned', async () => {
    (fetchMarriages as jest.Mock).mockResolvedValue([
      { id: 1, confirmationId: 7, partnersName: 'John & Jane', marriageDate: '2025-06-15', officiatingPriest: 'Fr. Smith', parish: 'St Mary' },
    ]);
    render(<MarriagesPage />);
    await waitFor(() => {
      expect(fetchMarriages).toHaveBeenCalled();
    });
    expect(screen.getByRole('main')).toHaveTextContent('John & Jane');
    expect(screen.getByRole('main')).toHaveTextContent('2025-06-15');
  });

  it('shows link to add new marriage', async () => {
    render(<MarriagesPage />);
    await waitFor(() => {
      expect(fetchMarriages).toHaveBeenCalled();
    });
    const addLink = screen.getByRole('link', { name: /add|new marriage/i });
    expect(addLink).toBeInTheDocument();
    expect(addLink.getAttribute('href')).toMatch(/marriages\/new/);
  });

  it('when no parishes shows message and no fetch to marriages', async () => {
    (useParish as jest.Mock).mockReturnValue({
      parishId: null,
      loading: false,
      setParishId: jest.fn(),
      parishes: [],
      error: null,
    });
    render(<MarriagesPage />);
    await waitFor(() => {
      expect(screen.getByText(/no parish/i)).toBeInTheDocument();
    });
    expect(fetchMarriages).not.toHaveBeenCalled();
  });
});
