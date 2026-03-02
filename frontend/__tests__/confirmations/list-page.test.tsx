/**
 * Confirmation list page (grid like Holy Communion).
 * - When authenticated, fetches confirmations for parish and shows grid/table or empty state
 * - Filters: All Years, All Genders, Search confirmations
 * - Desktop: table with BAPTISM NAME, OTHER NAMES, SURNAME, CONFIRMATION DATE, GENDER, FATHER, MOTHER, OFFICIATING BISHOP
 * - Mobile: card list with edit/menu icons
 * - When no parish available, shows message
 */
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import ConfirmationsPage from '@/app/confirmations/page';
import { getStoredToken, getStoredUser, fetchConfirmations } from '@/lib/api';
import { useParish } from '@/context/ParishContext';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/api', () => ({
  getStoredToken: jest.fn(),
  getStoredUser: jest.fn(),
  fetchConfirmations: jest.fn(),
}));

jest.mock('@/context/ParishContext', () => ({
  useParish: jest.fn(),
}));

const mockPush = jest.fn();
(useRouter as jest.Mock).mockReturnValue({ push: mockPush });

describe('Confirmations list page', () => {
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
    (fetchConfirmations as jest.Mock).mockResolvedValue([]);
    (fetchConfirmations as jest.Mock).mockClear();
  });

  it('when authenticated fetches confirmations and shows list heading', async () => {
    render(<ConfirmationsPage />);
    await waitFor(() => {
      expect(fetchConfirmations).toHaveBeenCalledWith(10);
    });
    expect(screen.getByRole('heading', { name: /confirmation/i })).toBeInTheDocument();
  });

  it('shows empty state when no confirmations', async () => {
    render(<ConfirmationsPage />);
    await waitFor(() => {
      expect(fetchConfirmations).toHaveBeenCalled();
    });
    expect(screen.getByText(/no confirmation records yet/i)).toBeInTheDocument();
  });

  it('shows list of confirmations when data returned', async () => {
    (fetchConfirmations as jest.Mock).mockResolvedValue([
      {
        id: 1,
        baptismId: 5,
        communionId: 2,
        confirmationDate: '2025-04-01',
        officiatingBishop: 'Bishop Jones',
        parish: 'St Mary',
        baptismName: 'John',
        otherNames: 'Paul',
        surname: 'Doe',
        gender: 'MALE',
        fathersName: 'James',
        mothersName: 'Mary',
      },
    ]);
    render(<ConfirmationsPage />);
    await waitFor(() => {
      expect(fetchConfirmations).toHaveBeenCalled();
    });
    expect(screen.getByRole('main')).toHaveTextContent('2025-04-01');
    expect(screen.getByRole('main')).toHaveTextContent('Bishop Jones');
    expect(screen.getByRole('main')).toHaveTextContent('John');
    expect(screen.getByRole('main')).toHaveTextContent('Doe');
  });

  it('shows filters: All Years, All Genders, and Search confirmations', async () => {
    render(<ConfirmationsPage />);
    await waitFor(() => {
      expect(fetchConfirmations).toHaveBeenCalled();
    });
    expect(screen.getByRole('combobox', { name: /filter by year/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /filter by gender/i })).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: /search confirmations/i })).toBeInTheDocument();
  });

  it('grid shows BAPTISM NAME, OTHER NAMES, SURNAME, CONFIRMATION DATE and OFFICIATING BISHOP column headers when confirmations exist', async () => {
    (fetchConfirmations as jest.Mock).mockResolvedValue([
      {
        id: 1,
        baptismId: 5,
        communionId: 2,
        confirmationDate: '2025-04-01',
        officiatingBishop: 'Bishop Jones',
        baptismName: 'Jane',
        otherNames: '',
        surname: 'Smith',
      },
    ]);
    render(<ConfirmationsPage />);
    await waitFor(() => {
      expect(screen.getByRole('columnheader', { name: /baptism name/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /other names/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /surname/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /confirmation date/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /officiating bishop/i })).toBeInTheDocument();
    });
  });

  it('clicking a table row navigates to confirmation detail', async () => {
    (fetchConfirmations as jest.Mock).mockResolvedValue([
      {
        id: 99,
        baptismId: 5,
        communionId: 2,
        confirmationDate: '2025-04-01',
        officiatingBishop: 'Bishop Jones',
        baptismName: 'Jane',
        otherNames: '',
        surname: 'Smith',
      },
    ]);
    render(<ConfirmationsPage />);
    await waitFor(() => {
      expect(screen.getByRole('grid')).toHaveTextContent('Jane');
    });
    const grid = screen.getByRole('grid');
    const cell = within(grid).getByRole('cell', { name: 'Jane' });
    const row = cell.closest('tr');
    expect(row).toBeInTheDocument();
    await userEvent.click(row!);
    expect(mockPush).toHaveBeenCalledWith('/confirmations/99');
  });

  it('shows link to add new confirmation', async () => {
    render(<ConfirmationsPage />);
    await waitFor(() => {
      expect(fetchConfirmations).toHaveBeenCalled();
    });
    const main = screen.getByRole('main');
    const addLinks = within(main).getAllByRole('link', { name: /add confirmation/i });
    expect(addLinks.length).toBeGreaterThanOrEqual(1);
    expect(addLinks[0].getAttribute('href')).toMatch(/confirmations\/new/);
  });

  it('when no parish shows message and no fetch', async () => {
    (useParish as jest.Mock).mockReturnValue({
      parishId: null,
      loading: false,
      setParishId: jest.fn(),
      parishes: [],
      error: null,
    });
    render(<ConfirmationsPage />);
    const main = screen.getByRole('main');
    await waitFor(() => {
      expect(within(main).getByText(/no parish available/i)).toBeInTheDocument();
    });
    expect(fetchConfirmations).not.toHaveBeenCalled();
  });

  it('search filters confirmations by name', async () => {
    (fetchConfirmations as jest.Mock).mockResolvedValue([
      {
        id: 1,
        baptismId: 5,
        communionId: 2,
        confirmationDate: '2025-04-01',
        officiatingBishop: 'Bishop Jones',
        baptismName: 'Jane',
        otherNames: '',
        surname: 'Doe',
      },
      {
        id: 2,
        baptismId: 6,
        communionId: 3,
        confirmationDate: '2025-05-01',
        officiatingBishop: 'Bishop Smith',
        baptismName: 'Bob',
        otherNames: 'Paul',
        surname: 'Smith',
      },
    ]);
    const user = userEvent.setup();
    render(<ConfirmationsPage />);
    await waitFor(() => {
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });
    const search = screen.getByRole('searchbox', { name: /search confirmations/i });
    await user.type(search, 'Jane');
    await waitFor(() => {
      expect(screen.getByRole('grid')).toHaveTextContent('Jane');
      expect(screen.getByRole('grid')).not.toHaveTextContent('Bob');
    });
  });
});
