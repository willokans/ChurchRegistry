/**
 * TDD: Authenticated layout tests.
 * - When authenticated: renders header with Parish Registry branding and cross, sidebar, and children
 * - When not authenticated: redirects to /login and does not render layout content
 */
import { render, screen, within } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { getStoredToken, getStoredUser } from '@/lib/api';
import { useParish } from '@/context/ParishContext';
import { defaultParishContext } from './test-utils';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/api', () => ({
  getStoredToken: jest.fn(),
  getStoredUser: jest.fn(),
}));

jest.mock('@/context/ParishContext', () => ({
  useParish: jest.fn(),
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
    (useParish as jest.Mock).mockReturnValue(defaultParishContext);
  });

  it('renders header with Parish Registry branding when authenticated', () => {
    render(
      <AuthenticatedLayout>
        <p>Dashboard content</p>
      </AuthenticatedLayout>
    );
    expect(screen.getAllByText('Parish Registry').length).toBeGreaterThanOrEqual(1);
  });

  it('renders a cross in the header when authenticated', () => {
    render(
      <AuthenticatedLayout>
        <p>Dashboard content</p>
      </AuthenticatedLayout>
    );
    const brandingHeader = screen.getAllByText('Parish Registry')[0].closest('header');
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

  it('Dashboard link points to /dashboard', () => {
    render(
      <AuthenticatedLayout>
        <p>Dashboard content</p>
      </AuthenticatedLayout>
    );
    const dashboardLink = screen.getByRole('link', { name: 'Dashboard' });
    expect(dashboardLink).toHaveAttribute('href', '/dashboard');
  });

  it('ADMIN sees Diocese Dashboard link pointing to /dashboard/diocese', () => {
    render(
      <AuthenticatedLayout>
        <p>Dashboard content</p>
      </AuthenticatedLayout>
    );
    const dioceseDashboardLink = screen.getByRole('link', { name: 'Diocese Dashboard' });
    expect(dioceseDashboardLink).toHaveAttribute('href', '/dashboard/diocese');
  });

  it('Help link points to /help in sidebar', () => {
    render(
      <AuthenticatedLayout>
        <p>Dashboard content</p>
      </AuthenticatedLayout>
    );
    const nav = screen.getByRole('navigation', { name: 'Main' });
    const helpLink = within(nav).getByRole('link', { name: 'Help' });
    expect(helpLink).toHaveAttribute('href', '/help');
  });

  it('redirects to /login when no token', () => {
    (getStoredToken as jest.Mock).mockReturnValue(null);
    render(
      <AuthenticatedLayout>
        <p>Dashboard content</p>
      </AuthenticatedLayout>
    );
    expect(mockPush).toHaveBeenCalledWith('/login');
    expect(screen.queryByText('Parish Registry')).not.toBeInTheDocument();
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

  it('parish selector displays only assigned parishes when parishes present', () => {
    (useParish as jest.Mock).mockReturnValue({
      ...defaultParishContext,
      parishId: 10,
      parishes: [
        { id: 10, parishName: 'St Mary', dioceseId: 1 },
        { id: 11, parishName: 'St John', dioceseId: 1 },
      ],
    });
    render(
      <AuthenticatedLayout>
        <p>Dashboard content</p>
      </AuthenticatedLayout>
    );
    const parishSelect = screen.getByRole('combobox', { name: /parish/i });
    expect(parishSelect).toBeInTheDocument();
    expect(within(parishSelect).getByRole('option', { name: 'St Mary' })).toBeInTheDocument();
    expect(within(parishSelect).getByRole('option', { name: 'St John' })).toBeInTheDocument();
  });

  it('no-assigned-parish state: non-admin sees "No parish assigned. Contact admin."', () => {
    (getStoredUser as jest.Mock).mockReturnValue({
      username: 'priest',
      displayName: 'Priest',
      role: 'PRIEST',
    });
    (useParish as jest.Mock).mockReturnValue({
      ...defaultParishContext,
      parishId: null,
      parishes: [],
      loading: false,
    });
    render(
      <AuthenticatedLayout>
        <p>Dashboard content</p>
      </AuthenticatedLayout>
    );
    expect(screen.getByText('No parish assigned. Contact admin.')).toBeInTheDocument();
  });

  it('SUPER_ADMIN sees User Setup link in sidebar', () => {
    (getStoredUser as jest.Mock).mockReturnValue({
      username: 'superadmin',
      displayName: 'Super Administrator',
      role: 'SUPER_ADMIN',
    });
    render(
      <AuthenticatedLayout>
        <p>Dashboard content</p>
      </AuthenticatedLayout>
    );
    expect(screen.getByRole('link', { name: 'User Setup' })).toHaveAttribute('href', '/users/setup');
  });

  it('ADMIN does not see User Setup link', () => {
    (getStoredUser as jest.Mock).mockReturnValue({
      username: 'admin',
      displayName: 'Admin',
      role: 'ADMIN',
    });
    render(
      <AuthenticatedLayout>
        <p>Dashboard content</p>
      </AuthenticatedLayout>
    );
    expect(screen.queryByRole('link', { name: 'User Setup' })).not.toBeInTheDocument();
  });

  it('non-admin does not see Diocese Dashboard link', () => {
    (getStoredUser as jest.Mock).mockReturnValue({
      username: 'priest',
      displayName: 'Priest',
      role: 'PRIEST',
    });
    render(
      <AuthenticatedLayout>
        <p>Dashboard content</p>
      </AuthenticatedLayout>
    );
    expect(screen.queryByRole('link', { name: 'Diocese Dashboard' })).not.toBeInTheDocument();
  });

  it('ADMIN sees Diocese selector when dioceses are loaded', () => {
    (useParish as jest.Mock).mockReturnValue({
      ...defaultParishContext,
      dioceses: [
        { id: 1, dioceseName: 'Archdiocese of Accra', parishes: [] },
        { id: 2, dioceseName: 'Diocese of Kumasi', parishes: [] },
      ],
    });
    render(
      <AuthenticatedLayout>
        <p>Dashboard content</p>
      </AuthenticatedLayout>
    );
    const dioceseSelect = screen.getByRole('combobox', { name: /diocese/i });
    expect(dioceseSelect).toBeInTheDocument();
    expect(within(dioceseSelect).getByRole('option', { name: 'Archdiocese of Accra' })).toBeInTheDocument();
    expect(within(dioceseSelect).getByRole('option', { name: 'Diocese of Kumasi' })).toBeInTheDocument();
  });

  it('no-assigned-parish state: admin sees "No parish selected" and Add diocese link', () => {
    (useParish as jest.Mock).mockReturnValue({
      ...defaultParishContext,
      parishId: null,
      parishes: [],
      loading: false,
    });
    render(
      <AuthenticatedLayout>
        <p>Dashboard content</p>
      </AuthenticatedLayout>
    );
    expect(screen.getByText('No parish selected')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /add diocese & parish/i })).toBeInTheDocument();
  });
});
