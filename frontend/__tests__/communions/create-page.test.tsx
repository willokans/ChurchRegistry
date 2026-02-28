/**
 * TDD: First Holy Communion create page.
 * - When authenticated and parishId in query, shows form (baptism picker, date, priest, parish) and creates on submit
 * - Redirects to list after successful create
 */
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter, useSearchParams } from 'next/navigation';
import CommunionCreatePage from '@/app/communions/new/page';
import { getStoredToken, getStoredUser, fetchBaptisms, createCommunion } from '@/lib/api';
import { useParish } from '@/context/ParishContext';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock('@/lib/api', () => ({
  getStoredToken: jest.fn(),
  getStoredUser: jest.fn(),
  fetchBaptisms: jest.fn(),
  createCommunion: jest.fn(),
}));

jest.mock('@/context/ParishContext', () => ({
  useParish: jest.fn(),
}));

const mockPush = jest.fn();
(useRouter as jest.Mock).mockReturnValue({ push: mockPush });

describe('Communion create page', () => {
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
    (fetchBaptisms as jest.Mock).mockResolvedValue([
      { id: 5, baptismName: 'Jane', surname: 'Doe', dateOfBirth: '2016-01-01' },
    ]);
    (createCommunion as jest.Mock).mockResolvedValue({ id: 99, baptismId: 5, communionDate: '2024-05-01' });
  });

  it('shows form with heading and required fields', async () => {
    render(<CommunionCreatePage />);
    await waitFor(() => {
      expect(fetchBaptisms).toHaveBeenCalledWith(10);
    });
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /communion details/i })).toBeInTheDocument();
    });
    expect(screen.getByRole('heading', { name: /new holy communion/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/select baptism|baptism record/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/communion date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/officiating priest/i)).toBeInTheDocument();
    const main = screen.getByRole('main');
    expect(screen.getByRole('combobox', { name: /mass venue/i })).toBeInTheDocument();
  });

  it('on submit creates communion and redirects to list', async () => {
    const user = userEvent.setup();
    render(<CommunionCreatePage />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /communion details/i })).toBeInTheDocument();
    });
    const main = screen.getByRole('main');
    await user.selectOptions(within(main).getByLabelText(/select baptism|baptism record/i), '5');
    await user.type(within(main).getByLabelText(/communion date/i), '2024-05-01');
    await user.type(within(main).getByLabelText(/officiating priest/i), 'Fr. Smith');
    await user.selectOptions(screen.getByRole('combobox', { name: /mass venue/i }), 'St Mary');
    await user.click(screen.getByRole('button', { name: /save.*communion|register communion/i }));

    await waitFor(() => {
      expect(createCommunion).toHaveBeenCalledWith(
        expect.objectContaining({
          baptismId: 5,
          communionDate: '2024-05-01',
          officiatingPriest: 'Fr. Smith',
          parish: 'St Mary',
        })
      );
    });
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/communions');
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
    render(<CommunionCreatePage />);
    await waitFor(() => {
      expect(screen.getByText(/select a parish from the communions list/i)).toBeInTheDocument();
    });
  });
});
