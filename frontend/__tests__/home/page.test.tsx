/**
 * TDD: Landing page (home) tests.
 * - Renders hero, features, access section, footer
 * - Sign in links present
 * - When authenticated, redirects to /dashboard
 */
import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import LandingPage from '@/app/page';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/api', () => ({
  getStoredToken: jest.fn(),
  getStoredUser: jest.fn(),
}));

const mockReplace = jest.fn();
(useRouter as jest.Mock).mockReturnValue({ replace: mockReplace });

describe('Landing page (home)', () => {
  beforeEach(() => {
    mockReplace.mockClear();
    const api = require('@/lib/api');
    api.getStoredToken.mockReturnValue(null);
    api.getStoredUser.mockReturnValue(null);
  });

  it('renders hero with headline and sign in button', () => {
    render(<LandingPage />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Sacramental Record Management/i);
    const signInLinks = screen.getAllByRole('link', { name: /sign in/i });
    expect(signInLinks.length).toBeGreaterThan(0);
    expect(signInLinks[0]).toHaveAttribute('href', '/login');
  });

  it('renders features section', () => {
    render(<LandingPage />);
    expect(screen.getByText(/Everything a parish needs to manage sacramental records/i)).toBeInTheDocument();
    expect(screen.getByText(/Register Sacraments/i)).toBeInTheDocument();
    expect(screen.getByText(/Search Parish Records/i)).toBeInTheDocument();
    expect(screen.getByText(/Generate Certificates/i)).toBeInTheDocument();
    expect(screen.getByText(/Multi-Parish Access/i)).toBeInTheDocument();
  });

  it('renders access section', () => {
    render(<LandingPage />);
    expect(screen.getByText(/Access is by invitation only/i)).toBeInTheDocument();
  });

  it('renders footer with Parish Registry branding', () => {
    render(<LandingPage />);
    expect(document.body).toHaveTextContent('Parish Registry');
    expect(document.body).toHaveTextContent(/Sacramental Record Management System/i);
  });

  it('when authenticated redirects to /dashboard', async () => {
    const api = require('@/lib/api');
    api.getStoredToken.mockReturnValue('jwt-123');
    api.getStoredUser.mockReturnValue({
      username: 'admin',
      displayName: 'Administrator',
      role: 'ADMIN',
    });

    render(<LandingPage />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('when not authenticated does not redirect', () => {
    render(<LandingPage />);
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
