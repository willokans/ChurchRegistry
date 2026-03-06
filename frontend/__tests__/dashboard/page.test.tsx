/**
 * TDD: Dashboard page tests.
 * - When not authenticated, redirects to login
 * - When authenticated, shows time-based greeting and user display name
 */
import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import DashboardPage from '@/app/dashboard/page';

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

const toPage = (arr: unknown[], totalElements = arr.length) => ({
  content: arr,
  totalElements,
  totalPages: Math.max(1, Math.ceil(totalElements / 50)),
  size: 50,
  number: 0,
  first: true,
  last: totalElements <= 50,
  numberOfElements: arr.length,
  empty: arr.length === 0,
});
jest.mock('@/lib/api', () => ({
  getStoredUser: jest.fn(),
  getStoredToken: jest.fn(),
  fetchDashboardCounts: jest.fn(() =>
    Promise.resolve({ baptisms: 0, communions: 0, confirmations: 0, marriages: 0, holyOrders: 0 })
  ),
  fetchBaptisms: jest.fn(() => Promise.resolve(toPage([]))),
  fetchCommunions: jest.fn(() => Promise.resolve(toPage([]))),
  fetchConfirmations: jest.fn(() => Promise.resolve(toPage([]))),
  fetchMarriages: jest.fn(() => Promise.resolve(toPage([]))),
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
    render(<DashboardPage />);
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

    render(<DashboardPage />);

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
    api.fetchBaptisms.mockResolvedValue(toPage([]));
    api.fetchCommunions.mockResolvedValue(toPage([
      { id: 1, baptismId: 1, communionDate: `${year}-01-10`, officiatingPriest: 'Fr A', parish: 'St Mary' },
      { id: 2, baptismId: 2, communionDate: `${year}-02-11`, officiatingPriest: 'Fr B', parish: 'St Mary' },
    ]));
    api.fetchConfirmations.mockResolvedValue(toPage([]));
    api.fetchMarriages.mockResolvedValue(toPage([]));

    localStorage.setItem('church_registry_token', 'jwt-123');
    localStorage.setItem(
      'church_registry_user',
      JSON.stringify({
        username: 'admin',
        displayName: 'Administrator',
        role: 'ADMIN',
      })
    );

    render(<DashboardPage />);

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

  it('shows accurate counts for parishes with 50+ records (uses dashboard-counts endpoint)', async () => {
    const api = require('@/lib/api');
    api.getStoredUser.mockReturnValue({
      username: 'admin',
      displayName: 'Administrator',
      role: 'ADMIN',
    });
    api.getStoredToken.mockReturnValue('jwt-123');
    // Dashboard counts endpoint returns accurate totals regardless of pagination
    api.fetchDashboardCounts.mockResolvedValue({
      baptisms: 120,
      communions: 0,
      confirmations: 0,
      marriages: 0,
      holyOrders: 0,
    });
    const fiftyBaptisms = Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      baptismName: 'John',
      surname: `Doe${i}`,
      parishId: 10,
      dateOfBirth: '2020-01-01',
    }));
    api.fetchBaptisms.mockResolvedValue(toPage(fiftyBaptisms, 120));
    api.fetchCommunions.mockResolvedValue(toPage([], 0));
    api.fetchConfirmations.mockResolvedValue(toPage([], 0));
    api.fetchMarriages.mockResolvedValue(toPage([], 0));

    localStorage.setItem('church_registry_token', 'jwt-123');
    localStorage.setItem(
      'church_registry_user',
      JSON.stringify({
        username: 'admin',
        displayName: 'Administrator',
        role: 'ADMIN',
      })
    );

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('120')).toBeInTheDocument();
    });
    const baptismCard = screen.getByText('120').closest('div')?.parentElement?.parentElement;
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
    api.fetchBaptisms.mockResolvedValue(toPage([
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
    ]));
    api.fetchCommunions.mockResolvedValue(toPage([]));
    api.fetchConfirmations.mockResolvedValue(toPage([]));
    api.fetchMarriages.mockResolvedValue(toPage([]));

    localStorage.setItem('church_registry_token', 'jwt-123');
    localStorage.setItem(
      'church_registry_user',
      JSON.stringify({
        username: 'admin',
        displayName: 'Administrator',
        role: 'ADMIN',
      })
    );

    render(<DashboardPage />);

    const baptismBar = await waitFor(() => screen.getByTitle('Baptisms: 1'));
    expect(baptismBar).toHaveStyle('height: 100%');
  });
});
