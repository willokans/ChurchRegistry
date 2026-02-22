/**
 * TDD: Confirmation view page.
 * - When authenticated, fetches confirmation by id and shows details
 * - When not found, shows not-found message
 */
import { render, screen, waitFor, within } from '@testing-library/react';
import { useRouter, useParams } from 'next/navigation';
import ConfirmationViewPage from '@/app/confirmations/[id]/page';
import { getStoredToken, getStoredUser, fetchConfirmation } from '@/lib/api';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}));

jest.mock('@/lib/api', () => ({
  getStoredToken: jest.fn(),
  getStoredUser: jest.fn(),
  fetchConfirmation: jest.fn(),
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

describe('Confirmation view page', () => {
  beforeEach(() => {
    (getStoredToken as jest.Mock).mockReturnValue('token');
    (getStoredUser as jest.Mock).mockReturnValue({ username: 'admin', displayName: 'Admin', role: 'ADMIN' });
    (useParams as jest.Mock).mockReturnValue({ id: '7' });
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
    expect(screen.getByRole('main')).toHaveTextContent('2025-04-01');
  });

  it('shows confirmation details', async () => {
    render(<ConfirmationViewPage />);
    await waitFor(() => {
      expect(screen.getByText(/Bishop Jones/)).toBeInTheDocument();
    });
    const main = screen.getByRole('main');
    expect(within(main).getByText(/St Mary/)).toBeInTheDocument();
    expect(within(main).getByText(/Communion #2|communion.*2/i)).toBeInTheDocument();
  });

  it('when confirmation not found shows not-found message', async () => {
    (fetchConfirmation as jest.Mock).mockResolvedValue(null);
    render(<ConfirmationViewPage />);
    await waitFor(() => {
      expect(screen.getByText(/not found/i)).toBeInTheDocument();
    });
  });
});
