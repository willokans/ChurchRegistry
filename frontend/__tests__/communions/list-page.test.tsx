/**
 * TDD: First Holy Communion list page.
 * - When authenticated, fetches communions for parish and shows list or empty state
 * - Shows link to add new communion
 * - When no parish available, shows message
 */
import { render, screen, waitFor, within } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import CommunionsPage from '@/app/communions/page';
import { getStoredToken, getStoredUser, fetchCommunions } from '@/lib/api';
import { useParish } from '@/context/ParishContext';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/api', () => ({
  getStoredToken: jest.fn(),
  getStoredUser: jest.fn(),
  fetchCommunions: jest.fn(),
}));

jest.mock('@/context/ParishContext', () => ({
  useParish: jest.fn(),
}));

(useRouter as jest.Mock).mockReturnValue({ push: jest.fn() });

describe('Communions list page', () => {
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
    (fetchCommunions as jest.Mock).mockResolvedValue([]);
    (fetchCommunions as jest.Mock).mockClear();
  });

  it('when authenticated fetches communions and shows list heading', async () => {
    render(<CommunionsPage />);
    await waitFor(() => {
      expect(fetchCommunions).toHaveBeenCalledWith(10);
    });
    expect(screen.getByRole('heading', { name: /holy communion|first holy communion|communions/i })).toBeInTheDocument();
  });

  it('shows empty state when no communions', async () => {
    render(<CommunionsPage />);
    await waitFor(() => {
      expect(fetchCommunions).toHaveBeenCalled();
    });
    expect(screen.getByText(/no communion records|no records/i)).toBeInTheDocument();
  });

  it('shows list of communions when data returned', async () => {
    (fetchCommunions as jest.Mock).mockResolvedValue([
      {
        id: 1,
        baptismId: 5,
        communionDate: '2024-05-01',
        officiatingPriest: 'Fr. Smith',
        parish: 'St Mary',
        baptismName: 'John',
        otherNames: 'Paul',
        surname: 'Doe',
      },
    ]);
    render(<CommunionsPage />);
    await waitFor(() => {
      expect(screen.getAllByText('John').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Doe').length).toBeGreaterThanOrEqual(1);
    });
    expect(screen.getByRole('main')).toHaveTextContent('2024-05-01');
    expect(screen.getByRole('main')).toHaveTextContent('Fr. Smith');
  });

  it('shows filters: All Years, All Genders, and Search communions', async () => {
    render(<CommunionsPage />);
    await waitFor(() => {
      expect(fetchCommunions).toHaveBeenCalled();
    });
    expect(screen.getByRole('combobox', { name: /filter by year/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /filter by gender/i })).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: /search communions/i })).toBeInTheDocument();
  });

  it('grid shows BAPTISM NAME, OTHER NAMES, SURNAME and COMMUNION DATE column headers when communions exist', async () => {
    (fetchCommunions as jest.Mock).mockResolvedValue([
      {
        id: 1,
        baptismId: 5,
        communionDate: '2024-05-01',
        officiatingPriest: 'Fr. Smith',
        parish: 'St Mary',
        baptismName: 'Jane',
        otherNames: '',
        surname: 'Smith',
      },
    ]);
    render(<CommunionsPage />);
    await waitFor(() => {
      expect(screen.getByRole('columnheader', { name: /baptism name/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /other names/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /surname/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /communion date/i })).toBeInTheDocument();
    });
    expect(screen.getByRole('columnheader', { name: /officiating priest/i })).toBeInTheDocument();
  });

  it('shows link to add new communion', async () => {
    render(<CommunionsPage />);
    await waitFor(() => {
      expect(fetchCommunions).toHaveBeenCalled();
    });
    const main = screen.getByRole('main');
    const addLinks = within(main).getAllByRole('link', { name: /add communion/i });
    expect(addLinks.length).toBeGreaterThanOrEqual(1);
    expect(addLinks[0].getAttribute('href')).toMatch(/communions\/new/);
  });

  it('when no parishes shows message and no fetch to communions', async () => {
    (useParish as jest.Mock).mockReturnValue({
      parishId: null,
      loading: false,
      setParishId: jest.fn(),
      parishes: [],
      error: null,
    });
    render(<CommunionsPage />);
    const main = screen.getByRole('main');
    await waitFor(() => {
      expect(within(main).getByText(/no parish available/i)).toBeInTheDocument();
    });
    expect(fetchCommunions).not.toHaveBeenCalled();
  });
});
