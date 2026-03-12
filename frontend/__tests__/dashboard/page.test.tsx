/**
 * TDD: Dashboard page tests.
 * - When not authenticated, redirects to login
 * - When authenticated, shows time-based greeting and user display name
 */
import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { SWRConfig } from 'swr';
import DashboardPage from '@/app/dashboard/page';

function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig value={{ provider: () => new Map() }}>
      {children}
    </SWRConfig>
  );
}

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

function toDashboard(
  counts: { baptisms: number; communions: number; confirmations: number; marriages: number },
  baptisms: unknown[] = [],
  communions: unknown[] = [],
  confirmations: unknown[] = [],
  marriages: unknown[] = []
) {
  return {
    counts: { ...counts, holyOrders: 0 },
    baptisms,
    communions,
    confirmations,
    marriages,
  };
}

jest.mock('@/lib/api', () => ({
  getStoredUser: jest.fn(),
  getStoredToken: jest.fn(),
  fetchDashboard: jest.fn(() =>
    Promise.resolve({
      counts: { baptisms: 0, communions: 0, confirmations: 0, marriages: 0, holyOrders: 0 },
      baptisms: [],
      communions: [],
      confirmations: [],
      marriages: [],
    })
  ),
}));

const mockReplace = jest.fn();
const mockPush = jest.fn();
(useRouter as jest.Mock).mockReturnValue({ replace: mockReplace, push: mockPush });

describe('Dashboard page', () => {
  beforeEach(() => {
    mockReplace.mockClear();
    localStorage.clear();
    const api = require('@/lib/api');
    api.getStoredUser.mockReturnValue(null);
    api.getStoredToken.mockReturnValue(null);
  });

  it('when not authenticated redirects to login', async () => {
    render(<TestWrapper><DashboardPage /></TestWrapper>);
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/login');
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

    render(<TestWrapper><DashboardPage /></TestWrapper>);

    await waitFor(() => {
      expect(screen.getByText(/welcome to st mary parish registry/i)).toBeInTheDocument();
    });
    const main = screen.getByRole('main');
    expect(main).toHaveTextContent(/Administrator/);
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('shows Holy Communion summary card with count', async () => {
    const year = new Date().getFullYear();
    const api = require('@/lib/api');
    api.getStoredUser.mockReturnValue({
      username: 'admin',
      displayName: 'Administrator',
      role: 'ADMIN',
    });
    api.getStoredToken.mockReturnValue('jwt-123');
    api.fetchDashboard.mockResolvedValue(toDashboard(
      { baptisms: 0, communions: 2, confirmations: 0, marriages: 0 },
      [],
      [
        { id: 1, baptismId: 1, communionDate: `${year}-01-10`, officiatingPriest: 'Fr A', parish: 'St Mary' },
        { id: 2, baptismId: 2, communionDate: `${year}-02-11`, officiatingPriest: 'Fr B', parish: 'St Mary' },
      ],
      [],
      []
    ));

    localStorage.setItem('church_registry_token', 'jwt-123');
    localStorage.setItem(
      'church_registry_user',
      JSON.stringify({
        username: 'admin',
        displayName: 'Administrator',
        role: 'ADMIN',
      })
    );

    render(<TestWrapper><DashboardPage /></TestWrapper>);

    await waitFor(() => {
      expect(screen.getAllByText(/^Holy Communion$/i).length).toBeGreaterThan(0);
    });
    const communionLabel = screen.getAllByText(/^Holy Communion$/i)[0];
    const communionCard = communionLabel.closest('div')?.parentElement ?? null;
    expect(communionCard).not.toBeNull();
    expect((communionCard as HTMLElement).textContent).toContain('2');
    await waitFor(() => {
      expect(screen.getAllByTitle('Holy Communion: 1').length).toBeGreaterThan(0);
    });
  });

  it('shows accurate counts for parishes with 50+ records (uses consolidated dashboard endpoint)', async () => {
    const api = require('@/lib/api');
    api.getStoredUser.mockReturnValue({
      username: 'admin',
      displayName: 'Administrator',
      role: 'ADMIN',
    });
    api.getStoredToken.mockReturnValue('jwt-123');
    const fiftyBaptisms = Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      baptismName: 'John',
      surname: `Doe${i}`,
      parishId: 10,
      dateOfBirth: '2020-01-01',
    }));
    api.fetchDashboard.mockResolvedValue(toDashboard(
      { baptisms: 120, communions: 0, confirmations: 0, marriages: 0 },
      fiftyBaptisms,
      [],
      [],
      []
    ));

    localStorage.setItem('church_registry_token', 'jwt-123');
    localStorage.setItem(
      'church_registry_user',
      JSON.stringify({
        username: 'admin',
        displayName: 'Administrator',
        role: 'ADMIN',
      })
    );

    render(<TestWrapper><DashboardPage /></TestWrapper>);

    await waitFor(() => {
      expect(screen.getByText(/120 records/)).toBeInTheDocument();
    });
    const baptismCard = screen.getByText(/120 records/).closest('div')?.parentElement?.parentElement;
    expect(baptismCard).toHaveTextContent(/Baptisms/);
  });

  it('renders visible grouped chart bars when monthly values are non-zero', async () => {
    const year = new Date().getFullYear();
    const api = require('@/lib/api');
    api.getStoredUser.mockReturnValue({
      username: 'admin',
      displayName: 'Administrator',
      role: 'ADMIN',
    });
    api.getStoredToken.mockReturnValue('jwt-123');
    api.fetchDashboard.mockResolvedValue(toDashboard(
      { baptisms: 1, communions: 0, confirmations: 0, marriages: 0 },
      [
        {
          id: 1,
          baptismName: 'John',
          otherNames: '',
          surname: 'Doe',
          gender: 'MALE',
          dateOfBirth: '2020-01-10',
          fathersName: 'Father',
          mothersName: 'Mother',
          sponsorNames: 'Sponsor',
          officiatingPriest: 'Fr A',
          parishId: 10,
          createdAt: `${year}-01-15T12:00:00.000Z`,
        },
      ],
      [],
      [],
      []
    ));

    localStorage.setItem('church_registry_token', 'jwt-123');
    localStorage.setItem(
      'church_registry_user',
      JSON.stringify({
        username: 'admin',
        displayName: 'Administrator',
        role: 'ADMIN',
      })
    );

    render(<TestWrapper><DashboardPage /></TestWrapper>);

    const baptismBar = await waitFor(() => screen.getByTitle('Baptisms: 1'));
    expect(baptismBar).toHaveStyle('height: 100%');
  });

  it('shows empty state with guidance and Register button when sacrament has 0 records', async () => {
    const api = require('@/lib/api');
    api.getStoredUser.mockReturnValue({
      username: 'admin',
      displayName: 'Administrator',
      role: 'ADMIN',
    });
    api.getStoredToken.mockReturnValue('jwt-123');
    api.fetchDashboard.mockResolvedValue(toDashboard(
      { baptisms: 0, communions: 0, confirmations: 0, marriages: 0 }
    ));

    localStorage.setItem('church_registry_token', 'jwt-123');
    localStorage.setItem(
      'church_registry_user',
      JSON.stringify({
        username: 'admin',
        displayName: 'Administrator',
        role: 'ADMIN',
      })
    );

    render(<TestWrapper><DashboardPage /></TestWrapper>);

    await waitFor(() => {
      expect(screen.getByText(/Start by registering your first baptism/)).toBeInTheDocument();
    });
    const baptismLinks = screen.getAllByRole('link', { name: /Register Baptism/ });
    expect(baptismLinks.some((el) => el.getAttribute('href') === '/baptisms/new?parishId=10')).toBe(true);
    expect(screen.getByText(/Start by registering your first communion/)).toBeInTheDocument();
    const communionLinks = screen.getAllByRole('link', { name: /Register Holy Communion/ });
    expect(communionLinks.some((el) => el.getAttribute('href') === '/communions/new?parishId=10')).toBe(true);
    expect(screen.getByText(/Start by registering your first confirmation/)).toBeInTheDocument();
    const confirmationLinks = screen.getAllByRole('link', { name: /Register Confirmation/ });
    expect(confirmationLinks.some((el) => el.getAttribute('href') === '/confirmations/new?parishId=10')).toBe(true);
    expect(screen.getByText(/Start by registering your first marriage/)).toBeInTheDocument();
    const marriageLinks = screen.getAllByRole('link', { name: /Register Marriage/ });
    expect(marriageLinks.some((el) => el.getAttribute('href') === '/marriages/new?parishId=10')).toBe(true);
  });

  it('does not show empty state guidance when sacrament has records', async () => {
    const api = require('@/lib/api');
    api.getStoredUser.mockReturnValue({
      username: 'admin',
      displayName: 'Administrator',
      role: 'ADMIN',
    });
    api.getStoredToken.mockReturnValue('jwt-123');
    api.fetchDashboard.mockResolvedValue(toDashboard(
      { baptisms: 5, communions: 0, confirmations: 0, marriages: 0 },
      [{ id: 1, baptismName: 'John', surname: 'Doe', parishId: 10, dateOfBirth: '2020-01-01' }],
      [],
      [],
      []
    ));

    localStorage.setItem('church_registry_token', 'jwt-123');
    localStorage.setItem(
      'church_registry_user',
      JSON.stringify({
        username: 'admin',
        displayName: 'Administrator',
        role: 'ADMIN',
      })
    );

    render(<TestWrapper><DashboardPage /></TestWrapper>);

    await waitFor(() => {
      expect(screen.getByText(/5 records/)).toBeInTheDocument();
    });
    expect(screen.queryByText(/Start by registering your first baptism/)).not.toBeInTheDocument();
    expect(screen.getByText(/Start by registering your first communion/)).toBeInTheDocument();
  });
});
