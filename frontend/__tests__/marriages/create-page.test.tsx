/**
 * TDD: Marriage create page (full form: groom, bride, marriage details, witnesses).
 * - When authenticated and parishId in context/query, shows form and creates via createMarriageWithParties
 * - Redirects to list after successful create
 */
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter, useSearchParams } from 'next/navigation';
import MarriageCreatePage from '@/app/marriages/new/page';
import {
  getStoredToken,
  getStoredUser,
  fetchBaptisms,
  fetchCommunions,
  fetchConfirmations,
  createMarriageWithParties,
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
  fetchConfirmations: jest.fn(),
  createMarriageWithParties: jest.fn(),
  uploadMarriageCertificate: jest.fn(),
}));

jest.mock('@/context/ParishContext', () => ({
  useParish: jest.fn(),
}));

const mockPush = jest.fn();
(useRouter as jest.Mock).mockReturnValue({ push: mockPush });

describe('Marriage create page', () => {
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
    (fetchBaptisms as jest.Mock).mockResolvedValue([]);
    (fetchCommunions as jest.Mock).mockResolvedValue([]);
    (fetchConfirmations as jest.Mock).mockResolvedValue([]);
    (createMarriageWithParties as jest.Mock).mockResolvedValue({ id: 99 });
  });

  it('shows form with heading and groom/bride sections', async () => {
    render(<MarriageCreatePage />);
    await waitFor(() => {
      expect(fetchBaptisms).toHaveBeenCalledWith(10);
      expect(fetchCommunions).toHaveBeenCalledWith(10);
      expect(fetchConfirmations).toHaveBeenCalledWith(10);
    });
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /create marriage record/i })).toBeInTheDocument();
    });
    expect(screen.getByText(/groom information/i)).toBeInTheDocument();
    expect(screen.getByText(/bride information/i)).toBeInTheDocument();
    expect(screen.getAllByLabelText(/full name/i).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByLabelText(/marriage date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/officiating priest/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /witnesses/i })).toBeInTheDocument();
  });

  it('on submit creates marriage with parties and redirects to list', async () => {
    const user = userEvent.setup();
    render(<MarriageCreatePage />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /create marriage record/i })).toBeInTheDocument();
    });
    const fullNameInputs = screen.getAllByLabelText(/full name/i);
    await user.type(fullNameInputs[0], 'John Doe');
    await user.type(fullNameInputs[1], 'Jane Smith');
    await user.type(screen.getByLabelText(/marriage date/i), '2025-06-15');
    await user.type(screen.getByLabelText(/church name/i), 'St Mary');
    await user.type(screen.getByLabelText(/officiating priest/i), 'Fr. Smith');
    // Parish is pre-filled from context
    const main = screen.getByRole('main');
    const parishInput = within(main).getByLabelText(/parish \*/i);
    expect(parishInput).toHaveValue('St Mary');
    // Witness inputs: in the section that has "Minimum of 2 witnesses" (groom/bride also have placeholder "Full Name")
    const witnessesSection = screen.getByText(/minimum of 2 witnesses required/i).closest('div');
    const witnessNameInputs = witnessesSection ? within(witnessesSection as HTMLElement).getAllByPlaceholderText(/full name/i) : screen.getAllByPlaceholderText(/full name/i).slice(-2);
    await user.type(witnessNameInputs[0], 'Witness One');
    await user.type(witnessNameInputs[1], 'Witness Two');
    await user.click(screen.getByRole('button', { name: /save marriage/i }));

    await waitFor(() => {
      expect(createMarriageWithParties).toHaveBeenCalledWith(
        expect.objectContaining({
          marriage: expect.objectContaining({
            marriageDate: '2025-06-15',
            officiatingPriest: 'Fr. Smith',
            parish: 'St Mary',
          }),
          groom: expect.objectContaining({ fullName: 'John Doe' }),
          bride: expect.objectContaining({ fullName: 'Jane Smith' }),
          witnesses: expect.arrayContaining([
            expect.objectContaining({ fullName: 'Witness One' }),
            expect.objectContaining({ fullName: 'Witness Two' }),
          ]),
        })
      );
    });
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/marriages');
    });
  });

  it('when no parishId shows message', () => {
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams(''));
    (useParish as jest.Mock).mockReturnValue({
      parishId: null,
      setParishId: jest.fn(),
      parishes: [],
      loading: false,
      error: null,
    });
    render(<MarriageCreatePage />);
    const main = screen.getByRole('main');
    expect(within(main).getByText(/select a parish from the marriages list/i)).toBeInTheDocument();
  });
});
