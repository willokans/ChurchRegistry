/**
 * Confirmation create page.
 * - When authenticated and parishId in query, shows form: Select Baptism Record, Select Holy Communion, Confirmation Details
 * - Baptism search (this parish) and Holy Communion search (when "Holy Communion in this church")
 * - Creates confirmation and redirects to list on submit
 */
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter, useSearchParams } from 'next/navigation';
import ConfirmationCreatePage from '@/app/confirmations/new/page';
import {
  getStoredToken,
  getStoredUser,
  fetchBaptisms,
  fetchCommunions,
  createConfirmation,
  createBaptismWithCertificate,
  createCommunion,
  createCommunionWithCommunionCertificate,
} from '@/lib/api';
import { useParish } from '@/context/ParishContext';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock('@/lib/api', () => ({
  getStoredToken: jest.fn(),
  getStoredUser: jest.fn(),
  fetchBaptisms: jest.fn(),
  fetchCommunions: jest.fn(),
  createConfirmation: jest.fn(),
  createBaptismWithCertificate: jest.fn(),
  createCommunion: jest.fn(),
  createCommunionWithCommunionCertificate: jest.fn(),
}));

jest.mock('@/context/ParishContext', () => ({
  useParish: jest.fn(),
}));

const mockPush = jest.fn();
(useRouter as jest.Mock).mockReturnValue({ push: mockPush });

const defaultBaptisms = [
  {
    id: 5,
    baptismName: 'Jane',
    otherNames: '',
    surname: 'Doe',
    dateOfBirth: '2016-01-01',
    fathersName: 'John',
    mothersName: 'Mary',
    parishId: 10,
  },
  {
    id: 6,
    baptismName: 'Bob',
    otherNames: 'Paul',
    surname: 'Smith',
    dateOfBirth: '2017-05-15',
    fathersName: 'Jim',
    mothersName: 'Ann',
    parishId: 10,
  },
];

const defaultCommunions = [
  {
    id: 2,
    baptismId: 5,
    communionDate: '2024-05-01',
    officiatingPriest: 'Fr. Smith',
    parish: 'St Mary',
    baptismName: 'Jane',
    otherNames: '',
    surname: 'Doe',
  },
  {
    id: 3,
    baptismId: 6,
    communionDate: '2024-06-15',
    officiatingPriest: 'Fr. Jones',
    parish: 'St Mary',
    baptismName: 'Bob',
    otherNames: 'Paul',
    surname: 'Smith',
  },
];

describe('Confirmation create page', () => {
  beforeEach(() => {
    mockPush.mockClear();
    (getStoredToken as jest.Mock).mockReturnValue('token');
    (getStoredUser as jest.Mock).mockReturnValue({ username: 'admin', displayName: 'Admin', role: 'ADMIN' });
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('parishId=10'));
    (useParish as jest.Mock).mockReturnValue({
      parishId: 10,
      setParishId: jest.fn(),
      parishes: [{ id: 10, parishName: 'St Mary', dioceseId: 1 }],
      loading: false,
      error: null,
    });
    (fetchBaptisms as jest.Mock).mockResolvedValue(defaultBaptisms);
    (fetchCommunions as jest.Mock).mockResolvedValue(defaultCommunions);
    (createConfirmation as jest.Mock).mockResolvedValue({ id: 99, communionId: 2, baptismId: 5 });
    (createBaptismWithCertificate as jest.Mock).mockResolvedValue({ id: 50 });
    (createCommunion as jest.Mock).mockResolvedValue({ id: 101, baptismId: 50 });
    (createCommunionWithCommunionCertificate as jest.Mock).mockResolvedValue({ id: 102, baptismId: 50 });
  });

  it('loads baptisms and communions and shows form with Select Baptism and Select Holy Communion', async () => {
    render(<ConfirmationCreatePage />);
    await waitFor(() => {
      expect(fetchBaptisms).toHaveBeenCalledWith(10);
      expect(fetchCommunions).toHaveBeenCalledWith(10);
    });
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /select baptism record/i })).toBeInTheDocument();
    });
    expect(screen.getByRole('heading', { name: /new confirmation/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /select holy communion/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /confirmation details/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/search baptism record/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirmation date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/officiating bishop/i)).toBeInTheDocument();
  });

  it('shows Search Holy Communion record when Holy Communion in this church is selected', async () => {
    render(<ConfirmationCreatePage />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /select holy communion/i })).toBeInTheDocument();
    });
    expect(screen.getByRole('radio', { name: /holy communion in this church/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/search holy communion record/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/search by name, communion date, or priest/i)).toBeInTheDocument();
  });

  describe('baptism search', () => {
    it('typing in baptism search filters and selecting shows selected baptism', async () => {
      const user = userEvent.setup();
      render(<ConfirmationCreatePage />);
      await waitFor(() => {
        expect(screen.getByLabelText(/search baptism records/i)).toBeInTheDocument();
      });
      await user.click(screen.getByLabelText(/search baptism records/i));
      await user.keyboard('Jane');
      await waitFor(() => {
        expect(document.getElementById('baptism-results-list')).toBeInTheDocument();
      });
      const baptismListbox = document.getElementById('baptism-results-list');
      await user.click(within(baptismListbox!).getByRole('option', { name: /jane doe/i }));
      await waitFor(() => {
        const changeButtons = screen.getAllByRole('button', { name: /change/i });
        expect(changeButtons.length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText(/date of baptism/i)).toBeInTheDocument();
      });
    });
  });

  describe('Holy Communion search', () => {
    it('typing in communion search shows filtered results and selecting sets communion', async () => {
      const user = userEvent.setup();
      render(<ConfirmationCreatePage />);
      await waitFor(() => {
        expect(screen.getByLabelText(/search holy communion records/i)).toBeInTheDocument();
      });
      await user.click(screen.getByLabelText(/search holy communion records/i));
      await user.keyboard('Jane');
      await waitFor(() => {
        expect(document.getElementById('communion-results-list')).toBeInTheDocument();
      });
      const communionListbox = document.getElementById('communion-results-list');
      await user.click(within(communionListbox!).getByRole('option', { name: /jane doe/i }));
      await waitFor(() => {
        expect(screen.getByText(/communion date.*may/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /change/i })).toBeInTheDocument();
      });
    });

    it('selecting a communion from search then filling confirmation details and submitting calls createConfirmation with that communion', async () => {
      const user = userEvent.setup();
      render(<ConfirmationCreatePage />);
      await waitFor(() => {
        expect(screen.getByLabelText(/search holy communion records/i)).toBeInTheDocument();
      });
      await user.click(screen.getByLabelText(/search holy communion records/i));
      await user.keyboard('Bob');
      await waitFor(() => {
        expect(document.getElementById('communion-results-list')).toBeInTheDocument();
      });
      const communionListbox = document.getElementById('communion-results-list');
      await user.click(within(communionListbox!).getByRole('option', { name: /bob.*smith/i }));
      const confirmationDateInput = document.getElementById('confirmationDate');
      expect(confirmationDateInput).toBeInTheDocument();
      await user.type(confirmationDateInput!, '2025-04-01');
      await user.type(screen.getByLabelText(/officiating bishop/i), 'Bishop Jones');
      await user.click(screen.getByRole('button', { name: /save confirmation/i }));

      await waitFor(() => {
        expect(createConfirmation).toHaveBeenCalledWith(
          expect.objectContaining({
            baptismId: 6,
            communionId: 3,
            confirmationDate: '2025-04-01',
            officiatingBishop: 'Bishop Jones',
          })
        );
      });
      expect(mockPush).toHaveBeenCalledWith('/confirmations');
    });
  });

  describe('baptism with existing communion', () => {
    it('when user selects a baptism that has a communion, shows that communion and submit uses it', async () => {
      const user = userEvent.setup();
      render(<ConfirmationCreatePage />);
      await waitFor(() => {
        expect(screen.getByLabelText(/search baptism records/i)).toBeInTheDocument();
      });
      await user.click(screen.getByLabelText(/search baptism records/i));
      await user.keyboard('Jane');
      await waitFor(() => {
        expect(document.getElementById('baptism-results-list')).toBeInTheDocument();
      });
      const baptismListbox = document.getElementById('baptism-results-list');
      await user.click(within(baptismListbox!).getByRole('option', { name: /jane doe/i }));
      await waitFor(() => {
        expect(screen.getByText(/this baptism has a holy communion record in this church/i)).toBeInTheDocument();
      });
      const confirmationDateInput = document.getElementById('confirmationDate');
      await user.type(confirmationDateInput!, '2025-04-01');
      await user.type(screen.getByLabelText(/officiating bishop/i), 'Bishop Jones');
      await user.click(screen.getByRole('button', { name: /save confirmation/i }));

      await waitFor(() => {
        expect(createConfirmation).toHaveBeenCalledWith(
          expect.objectContaining({
            baptismId: 5,
            communionId: 2,
            confirmationDate: '2025-04-01',
            officiatingBishop: 'Bishop Jones',
          })
        );
      });
      expect(mockPush).toHaveBeenCalledWith('/confirmations');
    });
  });

  it('when no parishId shows message', async () => {
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams(''));
    (useParish as jest.Mock).mockReturnValue({
      parishId: null,
      setParishId: jest.fn(),
      parishes: [],
      loading: false,
      error: null,
    });
    render(<ConfirmationCreatePage />);
    await waitFor(() => {
      expect(screen.getByText(/select a parish from the confirmations list/i)).toBeInTheDocument();
    });
  });

  it('submit without selecting baptism or communion shows error', async () => {
    const user = userEvent.setup();
    (createConfirmation as jest.Mock).mockClear();
    render(<ConfirmationCreatePage />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save confirmation/i })).toBeInTheDocument();
    });
    const confirmationDateInput = document.getElementById('confirmationDate');
    expect(confirmationDateInput).toBeInTheDocument();
    await user.type(confirmationDateInput!, '2025-04-01');
    await user.type(screen.getByLabelText(/officiating bishop/i), 'Bishop Jones');
    await user.click(screen.getByRole('button', { name: /save confirmation/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/select a baptism record|search and select a holy communion/i);
    });
    expect(createConfirmation).not.toHaveBeenCalled();
  });
});
