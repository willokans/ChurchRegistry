/**
 * TDD: Baptism list page.
 * - When authenticated, fetches baptisms for parish and shows list or empty state
 * - Shows filters (All Years, All Genders, Search) and table with BAPTISM NAME, OTHER NAMES, SURNAME, DATE OF BIRTH, GENDER, FATHER, MOTHER, SPONSOR, OFFICIATING PRIEST
 * - Shows link to add new baptism
 * - When no parish available, shows message
 */
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter, usePathname } from 'next/navigation';
import BaptismsPage from '@/app/baptisms/page';
import { getStoredToken, getStoredUser, fetchBaptisms, fetchBaptismsSearch } from '@/lib/api';
import { useParish } from '@/context/ParishContext';
import { defaultParishContext, renderWithSWR } from '../test-utils';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

jest.mock('@/lib/api', () => ({
  getStoredToken: jest.fn(),
  getStoredUser: jest.fn(),
  fetchBaptisms: jest.fn(),
  fetchBaptismsSearch: jest.fn(),
}));

jest.mock('@/context/ParishContext', () => ({
  useParish: jest.fn(),
}));

const mockPush = jest.fn();
(useRouter as jest.Mock).mockReturnValue({ push: mockPush });
(usePathname as jest.Mock).mockReturnValue('/baptisms');

describe('Baptisms list page', () => {
  beforeEach(() => {
    mockPush.mockClear();
    (getStoredToken as jest.Mock).mockReturnValue('token');
    (getStoredUser as jest.Mock).mockReturnValue({ username: 'admin', displayName: 'Admin', role: 'ADMIN' });
    (useParish as jest.Mock).mockReturnValue(defaultParishContext);
    (fetchBaptisms as jest.Mock).mockResolvedValue({ content: [] });
    (fetchBaptisms as jest.Mock).mockClear();
    (fetchBaptismsSearch as jest.Mock).mockResolvedValue({ content: [] });
    (fetchBaptismsSearch as jest.Mock).mockClear();
  });

  it('when authenticated fetches baptisms and shows list heading', async () => {
    renderWithSWR(<BaptismsPage />);
    await waitFor(() => {
        expect(fetchBaptisms).toHaveBeenCalledWith(10, 0, 50);
    });
    expect(screen.getByRole('heading', { name: /baptisms/i })).toBeInTheDocument();
  });

  it('shows empty state when no baptisms', async () => {
    renderWithSWR(<BaptismsPage />);
    await waitFor(() => {
      expect(fetchBaptisms).toHaveBeenCalled();
    });
    expect(screen.getByText(/no baptism records/i)).toBeInTheDocument();
  });

  it('shows list of baptisms when data returned', async () => {
    (fetchBaptisms as jest.Mock).mockResolvedValue({
      content: [
        { id: 1, baptismName: 'John', otherNames: '', surname: 'Doe', dateOfBirth: '2020-01-15', gender: 'MALE', fathersName: 'James', mothersName: 'Mary', sponsorNames: '', officiatingPriest: '' },
      ],
    });
    renderWithSWR(<BaptismsPage />);
    await waitFor(() => {
      expect(screen.getAllByText('John').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Doe').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows link to add new baptism', async () => {
    renderWithSWR(<BaptismsPage />);
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
      ...defaultParishContext,
      parishId: null,
      parishes: [],
    });
    renderWithSWR(<BaptismsPage />);
    const main = screen.getByRole('main');
    await waitFor(() => {
      expect(within(main).getByText(/no parish available/i)).toBeInTheDocument();
    });
    expect(fetchBaptisms).not.toHaveBeenCalled();
  });

  it('shows filters: All Years, All Genders, and Search baptisms', async () => {
    renderWithSWR(<BaptismsPage />);
    await waitFor(() => {
      expect(fetchBaptisms).toHaveBeenCalled();
    });
    // Year/gender selects are hidden on mobile (hidden md:block)
    expect(screen.getByRole('combobox', { name: /filter by year/i, hidden: true })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /filter by gender/i, hidden: true })).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: /search baptisms/i })).toBeInTheDocument();
    expect(screen.getByDisplayValue('')).toBeInTheDocument();
    const yearSelect = screen.getByRole('combobox', { name: /filter by year/i, hidden: true });
    expect(within(yearSelect).getByRole('option', { name: /all years/i })).toBeInTheDocument();
  });

  it('grid shows BAPTISM NAME, OTHER NAMES, SURNAME and SPONSOR, OFFICIATING PRIEST column headers when baptisms exist', async () => {
    (fetchBaptisms as jest.Mock).mockResolvedValue({
      content: [
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
      ],
    });
    renderWithSWR(<BaptismsPage />);
    await waitFor(() => {
      expect(screen.getByRole('columnheader', { name: /baptism name/i, hidden: true })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /other names/i, hidden: true })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /surname/i, hidden: true })).toBeInTheDocument();
    });
    expect(screen.getByRole('columnheader', { name: /sponsor/i, hidden: true })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /officiating priest/i, hidden: true })).toBeInTheDocument();
  });

  it('grid shows sponsor and officiating priest values in table rows', async () => {
    (fetchBaptisms as jest.Mock).mockResolvedValue({
      content: [
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
      ],
    });
    renderWithSWR(<BaptismsPage />);
    await waitFor(() => {
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      expect(screen.getByText('Fr. Smith')).toBeInTheDocument();
    });
  });

  it('filtering by year shows only baptisms from that year', async () => {
    (fetchBaptisms as jest.Mock).mockResolvedValue({
      content: [
        { id: 1, baptismName: 'Alice', otherNames: '', surname: 'A', dateOfBirth: '2024-05-01', gender: 'FEMALE', fathersName: 'A', mothersName: 'A', sponsorNames: '', officiatingPriest: '', parishId: 10 },
        { id: 2, baptismName: 'Bob', otherNames: '', surname: 'B', dateOfBirth: '2023-01-01', gender: 'MALE', fathersName: 'B', mothersName: 'B', sponsorNames: '', officiatingPriest: '', parishId: 10 },
      ],
    });
    renderWithSWR(<BaptismsPage />);
    await waitFor(() => {
      expect(screen.getAllByText('Alice').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Bob').length).toBeGreaterThanOrEqual(1);
    });
    const yearSelect = screen.getByRole('combobox', { name: /filter by year/i, hidden: true });
    await userEvent.selectOptions(yearSelect, '2024');
    expect(screen.getAllByText('Alice').length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText('Bob')).not.toBeInTheDocument();
  });

  it('when fetchBaptisms returns error (e.g. 403) shows error message', async () => {
    (fetchBaptisms as jest.Mock).mockRejectedValue(new Error('Forbidden'));
    renderWithSWR(<BaptismsPage />);
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/forbidden|failed to load/i);
    });
  });

  it('search filters baptisms by name (server-side search)', async () => {
    (fetchBaptisms as jest.Mock).mockResolvedValue({
      content: [
        { id: 1, baptismName: 'Alice', otherNames: '', surname: 'A', dateOfBirth: '2024-01-01', gender: 'FEMALE', fathersName: 'A', mothersName: 'A', sponsorNames: '', officiatingPriest: '', parishId: 10 },
        { id: 2, baptismName: 'Bob', otherNames: '', surname: 'B', dateOfBirth: '2024-01-01', gender: 'MALE', fathersName: 'B', mothersName: 'B', sponsorNames: '', officiatingPriest: '', parishId: 10 },
      ],
    });
    (fetchBaptismsSearch as jest.Mock).mockResolvedValue({
      content: [{ id: 1, baptismName: 'Alice', otherNames: '', surname: 'A', dateOfBirth: '2024-01-01', gender: 'FEMALE', fathersName: 'A', mothersName: 'A', sponsorNames: '', officiatingPriest: '', parishId: 10 }],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 50,
      first: true,
      last: true,
    });
    renderWithSWR(<BaptismsPage />);
    await waitFor(() => {
      expect(screen.getAllByText('Alice').length).toBeGreaterThanOrEqual(1);
    });
    const search = screen.getByRole('searchbox', { name: /search baptisms/i });
    await userEvent.type(search, 'Alice');
    await waitFor(
      () => {
        expect(fetchBaptismsSearch).toHaveBeenCalledWith(10, 'Alice', 0, 50);
        expect(screen.getAllByText('Alice').length).toBeGreaterThanOrEqual(1);
        expect(screen.queryByText('Bob')).not.toBeInTheDocument();
      },
      { timeout: 500 }
    );
  });

  it('shows pagination controls when multiple pages exist', async () => {
    const page1Items = Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      baptismName: `Baptism${i + 1}`,
      otherNames: '',
      surname: 'Test',
      dateOfBirth: '2020-01-01',
      gender: 'MALE',
      fathersName: 'Father',
      mothersName: 'Mother',
      sponsorNames: '',
      officiatingPriest: '',
      parishId: 10,
    }));
    (fetchBaptisms as jest.Mock).mockResolvedValue({
      content: page1Items,
      totalElements: 125,
      totalPages: 3,
      number: 0,
      size: 50,
      first: true,
      last: false,
    });
    renderWithSWR(<BaptismsPage />);
    await waitFor(() => {
      expect(screen.getByText(/showing 1–50 of 125/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/page 1 of 3/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /previous page/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /next page/i })).toBeEnabled();
  });

  it('fetches next page when Next is clicked', async () => {
    const page1Items = Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      baptismName: `Baptism${i + 1}`,
      otherNames: '',
      surname: 'Test',
      dateOfBirth: '2020-01-01',
      gender: 'MALE',
      fathersName: 'Father',
      mothersName: 'Mother',
      sponsorNames: '',
      officiatingPriest: '',
      parishId: 10,
    }));
    const page2Items = Array.from({ length: 50 }, (_, i) => ({
      id: i + 51,
      baptismName: `Baptism${i + 51}`,
      otherNames: '',
      surname: 'Test',
      dateOfBirth: '2020-01-01',
      gender: 'MALE',
      fathersName: 'Father',
      mothersName: 'Mother',
      sponsorNames: '',
      officiatingPriest: '',
      parishId: 10,
    }));
    (fetchBaptisms as jest.Mock)
      .mockResolvedValueOnce({
        content: page1Items,
        totalElements: 125,
        totalPages: 3,
        number: 0,
        size: 50,
        first: true,
        last: false,
      })
      .mockResolvedValueOnce({
        content: page2Items,
        totalElements: 125,
        totalPages: 3,
        number: 1,
        size: 50,
        first: false,
        last: false,
      });
    renderWithSWR(<BaptismsPage />);
    await waitFor(() => {
      expect(screen.getByText(/showing 1–50 of 125/i)).toBeInTheDocument();
    });
    await userEvent.click(screen.getByRole('button', { name: /next page/i }));
    await waitFor(() => {
      expect(fetchBaptisms).toHaveBeenCalledWith(10, 1, 50);
    });
    await waitFor(() => {
      expect(screen.getByText(/showing 51–100 of 125/i)).toBeInTheDocument();
    });
  });

  it('hides pagination when single page or fewer items than page size', async () => {
    (fetchBaptisms as jest.Mock).mockResolvedValue({
      content: [{ id: 1, baptismName: 'John', otherNames: '', surname: 'Doe', dateOfBirth: '2020-01-15', gender: 'MALE', fathersName: 'J', mothersName: 'M', sponsorNames: '', officiatingPriest: '', parishId: 10 }],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 50,
      first: true,
      last: true,
    });
    renderWithSWR(<BaptismsPage />);
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
    expect(screen.queryByText(/showing.*of \d+/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /previous page/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /next page/i })).not.toBeInTheDocument();
  });

  it('loads and displays page when 500+ baptisms (virtualized)', async () => {
    const baptisms = Array.from({ length: 600 }, (_, i) => ({
      id: i + 1,
      baptismName: `Baptism${i + 1}`,
      otherNames: '',
      surname: 'Test',
      dateOfBirth: '2020-01-01',
      gender: 'MALE',
      fathersName: 'Father',
      mothersName: 'Mother',
      sponsorNames: '',
      officiatingPriest: '',
      parishId: 10,
    }));
    (fetchBaptisms as jest.Mock).mockResolvedValue({ content: baptisms });
    renderWithSWR(<BaptismsPage />);
    await waitFor(() => {
        expect(fetchBaptisms).toHaveBeenCalledWith(10, 0, 50);
    });
    expect(screen.getByRole('heading', { name: /baptisms/i })).toBeInTheDocument();
    expect(screen.queryByText(/no baptism records/i)).not.toBeInTheDocument();
    // With 500+ items, virtualization is used. In JSDOM (no viewport), virtualizer
    // may render 0 visible items, so we only assert the page loads successfully.
  });
});
