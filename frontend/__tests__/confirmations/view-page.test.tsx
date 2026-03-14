/**
 * TDD: Confirmation view page.
 * - When authenticated, fetches confirmation by id and shows details
 * - When not found, shows not-found message
 */
import { render, screen, waitFor, within } from '@testing-library/react';
import { useRouter, useParams } from 'next/navigation';
import ConfirmationViewPage from '@/app/confirmations/[id]/page';
import {
  getStoredToken,
  getStoredUser,
  fetchConfirmation,
  fetchBaptism,
  fetchCommunion,
  fetchBaptismExternalCertificate,
  fetchCommunionCertificate,
  fetchConfirmationNoteHistory,
  updateConfirmationNotes,
} from '@/lib/api';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}));

jest.mock('@/lib/api', () => ({
  getStoredToken: jest.fn(),
  getStoredUser: jest.fn(),
  fetchConfirmation: jest.fn(),
  fetchBaptism: jest.fn(),
  fetchCommunion: jest.fn(),
  fetchBaptismExternalCertificate: jest.fn(),
  fetchCommunionCertificate: jest.fn(),
  fetchConfirmationNoteHistory: jest.fn(),
  updateConfirmationNotes: jest.fn(),
}));

jest.mock('@/context/ParishContext', () => ({
  useParish: () => ({
    parishId: 10,
    setParishId: jest.fn(),
    dioceseId: null,
    setDioceseId: jest.fn(),
    parishes: [{ id: 10, parishName: 'St Mary', dioceseId: 1 }],
    dioceses: [],
    loading: false,
    error: null,
    refetch: jest.fn(),
  }),
}));

(useRouter as jest.Mock).mockReturnValue({ push: jest.fn() });

describe('Confirmation view page', () => {
  beforeEach(() => {
    (getStoredToken as jest.Mock).mockReturnValue('token');
    (getStoredUser as jest.Mock).mockReturnValue({ username: 'admin', displayName: 'Admin', role: 'ADMIN' });
    (useParams as jest.Mock).mockReturnValue({ id: '7' });
    (fetchBaptism as jest.Mock).mockResolvedValue({
      id: 5,
      baptismName: 'John',
      otherNames: '',
      surname: 'Doe',
      gender: 'MALE',
      dateOfBirth: '1990-01-01',
      fathersName: 'Father Doe',
      mothersName: 'Mother Doe',
      sponsorNames: 'Sponsor',
      officiatingPriest: 'Fr. A',
      parishId: 10,
      parishName: 'St Mary',
    });
    (fetchCommunion as jest.Mock).mockResolvedValue({
      id: 2,
      baptismId: 5,
      communionDate: '2000-06-10',
      officiatingPriest: 'Fr. B',
      parish: 'St Mary',
    });
    (fetchBaptismExternalCertificate as jest.Mock).mockRejectedValue(new Error('no external cert'));
    (fetchCommunionCertificate as jest.Mock).mockRejectedValue(new Error('no external cert'));
    (fetchConfirmationNoteHistory as jest.Mock).mockResolvedValue([]);
    (updateConfirmationNotes as jest.Mock).mockResolvedValue({});
    (fetchConfirmation as jest.Mock).mockResolvedValue({
      id: 7,
      baptismId: 5,
      communionId: 2,
      confirmationDate: '2025-04-01',
      officiatingBishop: 'Bishop Jones',
      parish: 'St Mary',
    });
  });

  it('fetches confirmation by id and shows date', async () => {
    render(<ConfirmationViewPage />);
    await waitFor(() => {
      expect(fetchConfirmation).toHaveBeenCalledWith(7);
    });
    expect(screen.getByRole('main')).toHaveTextContent('April 1, 2025');
  });

  it('shows confirmation details', async () => {
    render(<ConfirmationViewPage />);
    await waitFor(() => {
      expect(screen.getAllByText(/Bishop Jones/).length).toBeGreaterThan(0);
    });
    const main = screen.getByRole('main');
    expect(within(main).getAllByText(/St Mary/).length).toBeGreaterThan(0);
    expect(within(main).getByText(/View Communion Record/i)).toBeInTheDocument();
  });

  it('when confirmation not found shows not-found message', async () => {
    (fetchConfirmation as jest.Mock).mockResolvedValue(null);
    render(<ConfirmationViewPage />);
    await waitFor(() => {
      expect(screen.getByText(/not found/i)).toBeInTheDocument();
    });
  });
});
