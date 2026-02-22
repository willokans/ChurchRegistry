/**
 * TDD: Baptism list page.
 * - When authenticated, fetches baptisms for parish and shows list or empty state
 * - Shows link to add new baptism
 * - When no parish available, shows message
 */
import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import BaptismsPage from '@/app/baptisms/page';
import { getStoredToken, getStoredUser, fetchBaptisms } from '@/lib/api';
import { useParish } from '@/context/ParishContext';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/api', () => ({
  getStoredToken: jest.fn(),
  getStoredUser: jest.fn(),
  fetchBaptisms: jest.fn(),
}));

jest.mock('@/context/ParishContext', () => ({
  useParish: jest.fn(),
}));

const mockPush = jest.fn();
(useRouter as jest.Mock).mockReturnValue({ push: mockPush });

describe('Baptisms list page', () => {
  beforeEach(() => {
    mockPush.mockClear();
    (getStoredToken as jest.Mock).mockReturnValue('token');
    (getStoredUser as jest.Mock).mockReturnValue({ username: 'admin', displayName: 'Admin', role: 'ADMIN' });
    (useParish as jest.Mock).mockReturnValue({
      parishId: 10,
      loading: false,
      setParishId: jest.fn(),
      parishes: [{ id: 10, parishName: 'St Mary', dioceseId: 1 }],
      error: null,
    });
    (fetchBaptisms as jest.Mock).mockResolvedValue([]);
    (fetchBaptisms as jest.Mock).mockClear();
  });

  it('when authenticated fetches baptisms and shows list heading', async () => {
    render(<BaptismsPage />);
    await waitFor(() => {
      expect(fetchBaptisms).toHaveBeenCalledWith(10);
    });
    expect(screen.getByRole('heading', { name: /baptisms/i })).toBeInTheDocument();
  });

  it('shows empty state when no baptisms', async () => {
    render(<BaptismsPage />);
    await waitFor(() => {
      expect(fetchBaptisms).toHaveBeenCalled();
    });
    expect(screen.getByText(/no baptism records/i)).toBeInTheDocument();
  });

  it('shows list of baptisms when data returned', async () => {
    (fetchBaptisms as jest.Mock).mockResolvedValue([
      { id: 1, baptismName: 'John', surname: 'Doe', dateOfBirth: '2020-01-15', gender: 'MALE' },
    ]);
    render(<BaptismsPage />);
    await waitFor(() => {
      expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
    });
  });

  it('shows link to add new baptism', async () => {
    render(<BaptismsPage />);
    await waitFor(() => {
      expect(fetchBaptisms).toHaveBeenCalled();
    });
    const addLink = screen.getByRole('link', { name: /add|new baptism/i });
    expect(addLink).toBeInTheDocument();
    expect(addLink.getAttribute('href')).toMatch(/baptisms\/new/);
  });

  it('when no parishes shows message and no fetch to baptisms', async () => {
    (useParish as jest.Mock).mockReturnValue({
      parishId: null,
      loading: false,
      setParishId: jest.fn(),
      parishes: [],
      error: null,
    });
    render(<BaptismsPage />);
    await waitFor(() => {
      expect(screen.getByText(/no parish/i)).toBeInTheDocument();
    });
    expect(fetchBaptisms).not.toHaveBeenCalled();
  });
});
