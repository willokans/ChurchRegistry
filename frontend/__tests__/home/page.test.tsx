/**
 * TDD: Dashboard page tests.
 * - When not authenticated, redirects to login
 * - When authenticated, shows time-based greeting and user display name
 */
import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import DashboardPage from '@/app/page';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
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

jest.mock('@/lib/api', () => ({
  getStoredUser: jest.fn(),
  getStoredToken: jest.fn(),
  fetchBaptisms: jest.fn(() => Promise.resolve([])),
  fetchCommunions: jest.fn(() => Promise.resolve([])),
  fetchConfirmations: jest.fn(() => Promise.resolve([])),
  fetchMarriages: jest.fn(() => Promise.resolve([])),
}));

const mockPush = jest.fn();
(useRouter as jest.Mock).mockReturnValue({ push: mockPush });

describe('Dashboard page', () => {
  beforeEach(() => {
    mockPush.mockClear();
    localStorage.clear();
    const api = require('@/lib/api');
    api.getStoredUser.mockReturnValue(null);
    api.getStoredToken.mockReturnValue(null);
  });

  it('when not authenticated redirects to login', async () => {
    render(<DashboardPage />);
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  it('when authenticated shows greeting and user display name', async () => {
    const api = require('@/lib/api');
    api.getStoredUser.mockReturnValue({
      username: 'admin',
      displayName: 'Administrator',
      role: 'ADMIN',
    });
    api.getStoredToken.mockReturnValue('jwt-123');
    localStorage.setItem('church_registry_token', 'jwt-123');
    localStorage.setItem('church_registry_user', JSON.stringify({
      username: 'admin',
      displayName: 'Administrator',
      role: 'ADMIN',
    }));

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/welcome to st mary parish registry/i)).toBeInTheDocument();
    });
    const main = screen.getByRole('main');
    expect(main).toHaveTextContent(/Administrator/);
    expect(mockPush).not.toHaveBeenCalled();
  });
});
