/**
 * TDD: Login page tests.
 * - Renders username and password inputs and submit button
 * - On successful login, stores tokens and redirects to home
 * - On failed login, shows error and does not redirect
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import LoginPage from '@/app/login/page';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

const mockPush = jest.fn();
(useRouter as jest.Mock).mockReturnValue({ push: mockPush });

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

describe('Login page', () => {
  beforeEach(() => {
    mockPush.mockClear();
    localStorage.clear();
  });

  it('renders login form with username, password and submit button', () => {
    render(<LoginPage />);
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in|login/i })).toBeInTheDocument();
  });

  it('on successful login stores token and redirects to home', async () => {
    const user = userEvent.setup();
    const mockResponse = {
      token: 'jwt-123',
      refreshToken: 'refresh-456',
      username: 'admin',
      displayName: 'Administrator',
      role: 'ADMIN',
    };
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    render(<LoginPage />);
    await user.type(screen.getByLabelText(/username/i), 'admin');
    await user.type(screen.getByLabelText(/password/i), 'password');
    await user.click(screen.getByRole('button', { name: /sign in|login/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_URL}/api/auth/login`,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'admin', password: 'password' }),
        })
      );
    });
    await waitFor(() => {
      expect(localStorage.getItem('church_registry_token')).toBe('jwt-123');
      expect(localStorage.getItem('church_registry_refresh_token')).toBe('refresh-456');
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  it('on failed login shows error and does not redirect', async () => {
    const user = userEvent.setup();
    global.fetch = jest.fn().mockResolvedValueOnce({ ok: false, status: 401 });

    render(<LoginPage />);
    await user.type(screen.getByLabelText(/username/i), 'admin');
    await user.type(screen.getByLabelText(/password/i), 'wrong');
    await user.click(screen.getByRole('button', { name: /sign in|login/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials|login failed/i)).toBeInTheDocument();
    });
    expect(mockPush).not.toHaveBeenCalled();
  });
});
