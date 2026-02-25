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

describe('Login page', () => {
  let locationHref: string;
  beforeEach(() => {
    mockPush.mockClear();
    localStorage.clear();
    locationHref = '';
    Object.defineProperty(window, 'location', {
      value: {
        get href() {
          return locationHref;
        },
        set href(v: string) {
          locationHref = v;
        },
        assign: jest.fn(),
      },
      writable: true,
    });
  });

  it('renders login form with email/phone, password and submit button', () => {
    render(<LoginPage />);
    expect(screen.getByLabelText(/email or phone number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password$/)).toBeInTheDocument();
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
    await user.type(screen.getByLabelText(/email or phone number/i), 'admin');
    await user.type(screen.getByLabelText(/^Password$/), 'password');
    await user.click(screen.getByRole('button', { name: /sign in|login/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/api\/auth\/login$/),
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
      expect(locationHref).toBe('/');
    });
  });

  it('on failed login shows error and does not redirect', async () => {
    const user = userEvent.setup();
    global.fetch = jest.fn().mockResolvedValueOnce({ ok: false, status: 401 });

    render(<LoginPage />);
    await user.type(screen.getByLabelText(/email or phone number/i), 'admin');
    await user.type(screen.getByLabelText(/^Password$/), 'wrong');
    await user.click(screen.getByRole('button', { name: /sign in|login/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials|login failed/i)).toBeInTheDocument();
    });
    expect(mockPush).not.toHaveBeenCalled();
  });
});
