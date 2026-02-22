/**
 * TDD: Marriage create page.
 * - When authenticated and parishId in query, shows form (confirmation picker, partners, date, priest, parish) and creates on submit
 * - Redirects to list after successful create
 */
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter, useSearchParams } from 'next/navigation';
import MarriageCreatePage from '@/app/marriages/new/page';
import { getStoredToken, getStoredUser, fetchConfirmations, createMarriage } from '@/lib/api';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock('@/lib/api', () => ({
  getStoredToken: jest.fn(),
  getStoredUser: jest.fn(),
  fetchConfirmations: jest.fn(),
  createMarriage: jest.fn(),
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

const mockPush = jest.fn();
(useRouter as jest.Mock).mockReturnValue({ push: mockPush });

describe('Marriage create page', () => {
  beforeEach(() => {
    mockPush.mockClear();
    (getStoredToken as jest.Mock).mockReturnValue('token');
    (getStoredUser as jest.Mock).mockReturnValue({ username: 'admin', displayName: 'Admin', role: 'ADMIN' });
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('parishId=10'));
    (fetchConfirmations as jest.Mock).mockResolvedValue([
      { id: 7, baptismId: 5, communionId: 2, confirmationDate: '2025-04-01', officiatingBishop: 'Bishop Jones', parish: 'St Mary' },
    ]);
    (createMarriage as jest.Mock).mockResolvedValue({ id: 99, confirmationId: 7, partnersName: 'John & Jane' });
  });

  it('shows form with heading and required fields', async () => {
    render(<MarriageCreatePage />);
    await waitFor(() => {
      expect(fetchConfirmations).toHaveBeenCalledWith(10);
    });
    expect(screen.getByRole('heading', { name: /new marriage|add marriage|holy matrimony/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/confirmation|select confirmation/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/partners|spouse/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/marriage date|date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/officiating priest|priest/i)).toBeInTheDocument();
    const main = screen.getByRole('main');
    expect(within(main).getByLabelText(/parish/i)).toBeInTheDocument();
  });

  it('on submit creates marriage and redirects to list', async () => {
    const user = userEvent.setup();
    render(<MarriageCreatePage />);
    await waitFor(() => {
      expect(fetchConfirmations).toHaveBeenCalled();
    });
    const main = screen.getByRole('main');
    await user.selectOptions(within(main).getByLabelText(/confirmation|select confirmation/i), '7');
    await user.type(within(main).getByLabelText(/partners|spouse/i), 'John & Jane Doe');
    await user.type(within(main).getByLabelText(/marriage date|date/i), '2025-06-15');
    await user.type(within(main).getByLabelText(/officiating priest|priest/i), 'Fr. Smith');
    await user.type(within(main).getByLabelText(/parish/i), 'St Mary');
    await user.click(screen.getByRole('button', { name: /save|create|submit/i }));

    await waitFor(() => {
      expect(createMarriage).toHaveBeenCalledWith(
        expect.objectContaining({
          confirmationId: 7,
          partnersName: 'John & Jane Doe',
          marriageDate: '2025-06-15',
          officiatingPriest: 'Fr. Smith',
          parish: 'St Mary',
        })
      );
    });
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/marriages');
    });
  });

  it('when no parishId shows message', () => {
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams(''));
    render(<MarriageCreatePage />);
    const main = screen.getByRole('main');
    expect(within(main).getByText(/select a parish from the marriages list/i)).toBeInTheDocument();
  });
});
