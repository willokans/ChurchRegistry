/**
 * TDD: Authenticated layout tests.
 * - When authenticated: renders header with Church Registry branding and cross, sidebar, and children
 * - When not authenticated: redirects to /login and does not render layout content
 */
import { render, screen } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { getStoredToken, getStoredUser } from '@/lib/api';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/api', () => ({
  getStoredToken: jest.fn(),
  getStoredUser: jest.fn(),
}));

const mockPush = jest.fn();
(useRouter as jest.Mock).mockReturnValue({ push: mockPush });

describe('AuthenticatedLayout', () => {
  beforeEach(() => {
    mockPush.mockClear();
    (getStoredToken as jest.Mock).mockReturnValue('token');
    (getStoredUser as jest.Mock).mockReturnValue({
      username: 'admin',
      displayName: 'Admin',
      role: 'ADMIN',
    });
  });

  it('renders header with Church Registry branding when authenticated', () => {
    render(
      <AuthenticatedLayout>
        <p>Dashboard content</p>
      </AuthenticatedLayout>
    );
    expect(screen.getAllByText('Church Registry').length).toBeGreaterThanOrEqual(1);
  });

  it('renders a cross in the header when authenticated', () => {
    render(
      <AuthenticatedLayout>
        <p>Dashboard content</p>
      </AuthenticatedLayout>
    );
    const brandingHeader = screen.getAllByText('Church Registry')[0].closest('header');
    expect(brandingHeader).toBeInTheDocument();
    expect(brandingHeader?.querySelector('svg')).toBeInTheDocument();
  });

  it('renders a sidebar (navigation) when authenticated', () => {
    render(
      <AuthenticatedLayout>
        <p>Dashboard content</p>
      </AuthenticatedLayout>
    );
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('renders children when authenticated', () => {
    render(
      <AuthenticatedLayout>
        <p>Dashboard content</p>
      </AuthenticatedLayout>
    );
    expect(screen.getByText('Dashboard content')).toBeInTheDocument();
  });

  it('redirects to /login when no token', () => {
    (getStoredToken as jest.Mock).mockReturnValue(null);
    render(
      <AuthenticatedLayout>
        <p>Dashboard content</p>
      </AuthenticatedLayout>
    );
    expect(mockPush).toHaveBeenCalledWith('/login');
    expect(screen.queryByText('Church Registry')).not.toBeInTheDocument();
  });

  it('redirects to /login when no user', () => {
    (getStoredUser as jest.Mock).mockReturnValue(null);
    render(
      <AuthenticatedLayout>
        <p>Dashboard content</p>
      </AuthenticatedLayout>
    );
    expect(mockPush).toHaveBeenCalledWith('/login');
    expect(screen.queryByText('Dashboard content')).not.toBeInTheDocument();
  });
});
