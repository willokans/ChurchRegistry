/**
 * TDD: Baptism list page.
 * - When authenticated, fetches baptisms for parish and shows list or empty state
 * - Shows filters (All Years, All Genders, Search) and table with BAPTISM NAME, OTHER NAMES, SURNAME, DATE OF BIRTH, GENDER, FATHER, MOTHER, SPONSOR, OFFICIATING PRIEST
 * - Shows link to add new baptism
 * - When no parish available, shows message
 */
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import BaptismsPage from '@/app/baptisms/page';
import { getStoredToken, getStoredUser, fetchBaptisms } from '@/lib/api';
import { useParish } from '@/context/ParishContext';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/api', () => ({
  getStoredToken: jest.fn(),
  getStoredUser: jest.fn(),
  fetchBaptisms: jest.fn(),
}));

jest.mock('@/context/ParishContext', () => ({
  useParish: jest.fn(),
}));

const mockPush = jest.fn();
(useRouter as jest.Mock).mockReturnValue({ push: mockPush });

describe('Baptisms list page', () => {
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
    (fetchBaptisms as jest.Mock).mockResolvedValue([]);
    (fetchBaptisms as jest.Mock).mockClear();
  });

  it('when authenticated fetches baptisms and shows list heading', async () => {
    render(<BaptismsPage />);
    await waitFor(() => {
      expect(fetchBaptisms).toHaveBeenCalledWith(10);
    });
    expect(screen.getByRole('heading', { name: /baptisms/i })).toBeInTheDocument();
  });

  it('shows empty state when no baptisms', async () => {
    render(<BaptismsPage />);
    await waitFor(() => {
      expect(fetchBaptisms).toHaveBeenCalled();
    });
    expect(screen.getByText(/no baptism records/i)).toBeInTheDocument();
  });

  it('shows list of baptisms when data returned', async () => {
    (fetchBaptisms as jest.Mock).mockResolvedValue([
      { id: 1, baptismName: 'John', otherNames: '', surname: 'Doe', dateOfBirth: '2020-01-15', gender: 'MALE', fathersName: 'James', mothersName: 'Mary', sponsorNames: '', officiatingPriest: '' },
    ]);
    render(<BaptismsPage />);
    await waitFor(() => {
      expect(screen.getAllByText('John').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Doe').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows link to add new baptism', async () => {
    render(<BaptismsPage />);
    await waitFor(() => {
      expect(fetchBaptisms).toHaveBeenCalled();
    });
    const main = screen.getByRole('main');
    const addLinks = within(main).getAllByRole('link', { name: /add baptism/i });
    expect(addLinks.length).toBeGreaterThanOrEqual(1);
    expect(addLinks[0].getAttribute('href')).toMatch(/baptisms\/new/);
  });

  it('when no parishes shows message and no fetch to baptisms', async () => {
    (useParish as jest.Mock).mockReturnValue({
      parishId: null,
      loading: false,
      setParishId: jest.fn(),
      parishes: [],
      error: null,
    });
    render(<BaptismsPage />);
    const main = screen.getByRole('main');
    await waitFor(() => {
      expect(within(main).getByText(/no parish available/i)).toBeInTheDocument();
    });
    expect(fetchBaptisms).not.toHaveBeenCalled();
  });

  it('shows filters: All Years, All Genders, and Search baptisms', async () => {
    render(<BaptismsPage />);
    await waitFor(() => {
      expect(fetchBaptisms).toHaveBeenCalled();
    });
    expect(screen.getByRole('combobox', { name: /filter by year/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /filter by gender/i })).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: /search baptisms/i })).toBeInTheDocument();
    expect(screen.getByDisplayValue('')).toBeInTheDocument();
    const yearSelect = screen.getByRole('combobox', { name: /filter by year/i });
    expect(within(yearSelect).getByRole('option', { name: /all years/i })).toBeInTheDocument();
  });

  it('grid shows BAPTISM NAME, OTHER NAMES, SURNAME and SPONSOR, OFFICIATING PRIEST column headers when baptisms exist', async () => {
    (fetchBaptisms as jest.Mock).mockResolvedValue([
      {
        id: 1,
        baptismName: 'John',
        otherNames: '',
        surname: 'Doe',
        dateOfBirth: '2020-01-15',
        gender: 'MALE',
        fathersName: 'James',
        mothersName: 'Mary',
        sponsorNames: 'Jane Doe',
        officiatingPriest: 'Fr. Smith',
        parishId: 10,
      },
    ]);
    render(<BaptismsPage />);
    await waitFor(() => {
      expect(screen.getByRole('columnheader', { name: /baptism name/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /other names/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /surname/i })).toBeInTheDocument();
    });
    expect(screen.getByRole('columnheader', { name: /sponsor/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /officiating priest/i })).toBeInTheDocument();
  });

  it('grid shows sponsor and officiating priest values in table rows', async () => {
    (fetchBaptisms as jest.Mock).mockResolvedValue([
      {
        id: 1,
        baptismName: 'John',
        otherNames: '',
        surname: 'Doe',
        dateOfBirth: '2020-01-15',
        gender: 'MALE',
        fathersName: 'James',
        mothersName: 'Mary',
        sponsorNames: 'Jane Doe',
        officiatingPriest: 'Fr. Smith',
        parishId: 10,
      },
    ]);
    render(<BaptismsPage />);
    await waitFor(() => {
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      expect(screen.getByText('Fr. Smith')).toBeInTheDocument();
    });
  });

  it('filtering by year shows only baptisms from that year', async () => {
    (fetchBaptisms as jest.Mock).mockResolvedValue([
      { id: 1, baptismName: 'Alice', otherNames: '', surname: 'A', dateOfBirth: '2024-05-01', gender: 'FEMALE', fathersName: 'A', mothersName: 'A', sponsorNames: '', officiatingPriest: '', parishId: 10 },
      { id: 2, baptismName: 'Bob', otherNames: '', surname: 'B', dateOfBirth: '2023-01-01', gender: 'MALE', fathersName: 'B', mothersName: 'B', sponsorNames: '', officiatingPriest: '', parishId: 10 },
    ]);
    render(<BaptismsPage />);
    await waitFor(() => {
      expect(screen.getAllByText('Alice').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Bob').length).toBeGreaterThanOrEqual(1);
    });
    const yearSelect = screen.getByRole('combobox', { name: /filter by year/i });
    await userEvent.selectOptions(yearSelect, '2024');
    expect(screen.getAllByText('Alice').length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText('Bob')).not.toBeInTheDocument();
  });

  it('search filters baptisms by name', async () => {
    (fetchBaptisms as jest.Mock).mockResolvedValue([
      { id: 1, baptismName: 'Alice', otherNames: '', surname: 'A', dateOfBirth: '2024-01-01', gender: 'FEMALE', fathersName: 'A', mothersName: 'A', sponsorNames: '', officiatingPriest: '', parishId: 10 },
      { id: 2, baptismName: 'Bob', otherNames: '', surname: 'B', dateOfBirth: '2024-01-01', gender: 'MALE', fathersName: 'B', mothersName: 'B', sponsorNames: '', officiatingPriest: '', parishId: 10 },
    ]);
    render(<BaptismsPage />);
    await waitFor(() => {
      expect(screen.getAllByText('Alice').length).toBeGreaterThanOrEqual(1);
    });
    const search = screen.getByRole('searchbox', { name: /search baptisms/i });
    await userEvent.type(search, 'Alice');
    expect(screen.getAllByText('Alice').length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText('Bob')).not.toBeInTheDocument();
  });
});
