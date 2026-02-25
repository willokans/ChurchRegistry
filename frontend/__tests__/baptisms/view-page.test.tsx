/**
 * TDD: Baptism view page.
 * - When authenticated, fetches baptism by id and shows details
 * - When not found, shows not-found message
 */
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter, useParams } from 'next/navigation';
import BaptismViewPage from '@/app/baptisms/[id]/page';
import { getStoredToken, getStoredUser, fetchBaptism, fetchBaptismNoteHistory, updateBaptismNotes } from '@/lib/api';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}));

jest.mock('@/lib/api', () => ({
  getStoredToken: jest.fn(),
  getStoredUser: jest.fn(),
  fetchBaptism: jest.fn(),
  updateBaptismNotes: jest.fn(),
  fetchBaptismNoteHistory: jest.fn(),
  emailBaptismCertificate: jest.fn(),
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

(useRouter as jest.Mock).mockReturnValue({ push: jest.fn() });

describe('Baptism view page', () => {
  beforeEach(() => {
    (getStoredToken as jest.Mock).mockReturnValue('token');
    (getStoredUser as jest.Mock).mockReturnValue({ username: 'admin', displayName: 'Admin', role: 'ADMIN' });
    (useParams as jest.Mock).mockReturnValue({ id: '123' });
    (fetchBaptism as jest.Mock).mockResolvedValue({
      id: 123,
      baptismName: 'John',
      otherNames: '',
      surname: 'Doe',
      gender: 'MALE',
      dateOfBirth: '2020-01-15',
      fathersName: 'James',
      mothersName: 'Mary',
      sponsorNames: 'Peter, Anne',
      officiatingPriest: 'Fr. Williams',
      parishId: 10,
    });
    (fetchBaptismNoteHistory as jest.Mock).mockResolvedValue([]);
  });

  it('fetches baptism by id and shows name', async () => {
    render(<BaptismViewPage />);
    await waitFor(() => {
      expect(fetchBaptism).toHaveBeenCalledWith(123);
    });
    expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
  });

  it('shows baptism details', async () => {
    render(<BaptismViewPage />);
    await waitFor(() => {
      expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
    });
    const main = screen.getByRole('main');
    expect(within(main).getByText(/James/i)).toBeInTheDocument();
    expect(within(main).getByText(/^Mary$/)).toBeInTheDocument();
    expect(within(main).getByText(/Peter, Anne/i)).toBeInTheDocument();
    expect(within(main).getByText(/Fr\. Williams/i)).toBeInTheDocument();
  });

  it('shows other names when present', async () => {
    (fetchBaptism as jest.Mock).mockResolvedValue({
      id: 124,
      baptismName: 'John',
      otherNames: 'Paul',
      surname: 'Doe',
      gender: 'MALE',
      dateOfBirth: '2020-01-15',
      fathersName: 'James',
      mothersName: 'Mary',
      sponsorNames: 'Peter',
      officiatingPriest: 'Fr. Williams',
      parishId: 10,
    });
    render(<BaptismViewPage />);
    await waitFor(() => {
      expect(screen.getByText(/John Paul Doe/i)).toBeInTheDocument();
    });
    const main = screen.getByRole('main');
    expect(within(main).getByText(/Other names/i)).toBeInTheDocument();
    const paulElements = within(main).getAllByText(/^Paul$/);
    expect(paulElements.length).toBeGreaterThanOrEqual(1);
  });

  it('when baptism not found shows not-found message', async () => {
    (fetchBaptism as jest.Mock).mockResolvedValue(null);
    render(<BaptismViewPage />);
    await waitFor(() => {
      expect(screen.getByText(/not found/i)).toBeInTheDocument();
    });
  });

  it('shows Notes section with textarea and Save Notes button', async () => {
    render(<BaptismViewPage />);
    await waitFor(() => {
      expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
    });
    expect(screen.getByRole('heading', { name: /notes/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/add any additional notes/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save notes/i })).toBeInTheDocument();
  });

  it('shows Print Certificate link', async () => {
    render(<BaptismViewPage />);
    await waitFor(() => {
      expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
    });
    const printLink = screen.getByRole('link', { name: /print certificate/i });
    expect(printLink).toBeInTheDocument();
    expect(printLink).toHaveAttribute('href', '/baptisms/123/certificate');
  });

  it('fetches note history when baptism is loaded', async () => {
    render(<BaptismViewPage />);
    await waitFor(() => {
      expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(fetchBaptismNoteHistory).toHaveBeenCalledWith(123);
    });
  });

  it('shows Note history section with empty state when no notes', async () => {
    render(<BaptismViewPage />);
    await waitFor(() => {
      expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /note history/i })).toBeInTheDocument();
    });
    expect(screen.getByText(/all saved notes for this record, newest first/i)).toBeInTheDocument();
    expect(screen.getByText(/no notes saved yet/i)).toBeInTheDocument();
  });

  it('shows note history entries when API returns notes', async () => {
    (fetchBaptismNoteHistory as jest.Mock).mockResolvedValue([
      { id: 1, baptismId: 123, content: 'First note', createdAt: '2026-02-20T10:00:00Z' },
      { id: 2, baptismId: 123, content: 'Second note', createdAt: '2026-02-22T14:30:00Z' },
    ]);
    render(<BaptismViewPage />);
    await waitFor(() => {
      expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText('First note')).toBeInTheDocument();
      expect(screen.getByText('Second note')).toBeInTheDocument();
    });
  });

  it('saving notes calls updateBaptismNotes and then refreshes note history', async () => {
    const user = userEvent.setup();
    (updateBaptismNotes as jest.Mock).mockResolvedValue({
      id: 123,
      baptismName: 'John',
      surname: 'Doe',
      note: 'New note text',
    });
    (fetchBaptismNoteHistory as jest.Mock)
      .mockResolvedValueOnce([])
      .mockResolvedValue([{ id: 1, baptismId: 123, content: 'New note text', createdAt: '2026-02-22T15:00:00Z' }]);
    render(<BaptismViewPage />);
    await waitFor(() => {
      expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
    });
    await user.type(screen.getByPlaceholderText(/add any additional notes/i), 'New note text');
    await user.click(screen.getByRole('button', { name: /save notes/i }));
    await waitFor(() => {
      expect(updateBaptismNotes).toHaveBeenCalledWith(123, 'New note text');
    });
    const historyHeading = screen.getByRole('heading', { name: /note history/i });
    const historySection = historyHeading.closest('section');
    await waitFor(() => {
      expect(within(historySection!).getByText('New note text')).toBeInTheDocument();
    });
    expect(fetchBaptismNoteHistory).toHaveBeenCalledWith(123);
  });
});
