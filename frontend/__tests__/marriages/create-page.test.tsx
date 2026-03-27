/**
 * TDD: Marriage create page (full form: groom, bride, marriage details, witnesses).
 * - When authenticated and parishId in context/query, shows form and creates via createMarriageWithParties
 * - Redirects to list after successful create
 */
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import MarriageCreatePage from '@/app/marriages/new/page';
import {
  getStoredToken,
  getStoredUser,
  fetchBaptisms,
  fetchCommunions,
  fetchConfirmations,
  fetchParishMarriageRequirements,
  createMarriageWithParties,
} from '@/lib/api';
import { useParish } from '@/context/ParishContext';
import { defaultParishContext } from '../test-utils';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
  usePathname: jest.fn(),
}));

jest.mock('@/lib/api', () => ({
  getStoredToken: jest.fn(),
  getStoredUser: jest.fn(),
  fetchBaptisms: jest.fn(),
  fetchCommunions: jest.fn(),
  fetchConfirmations: jest.fn(),
  fetchParishMarriageRequirements: jest.fn(),
  createMarriageWithParties: jest.fn(),
  uploadMarriageCertificate: jest.fn(),
}));

jest.mock('@/context/ParishContext', () => ({
  useParish: jest.fn(),
}));

const mockPush = jest.fn();
(useRouter as jest.Mock).mockReturnValue({ push: mockPush });
(usePathname as jest.Mock).mockReturnValue('/marriages/new');

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
    (fetchBaptisms as jest.Mock).mockResolvedValue({
      content: [
        {
          id: 1,
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
        },
        {
          id: 2,
          baptismName: 'Jane',
          otherNames: '',
          surname: 'Smith',
          gender: 'FEMALE',
          dateOfBirth: '1992-02-02',
          fathersName: 'Father Smith',
          mothersName: 'Mother Smith',
          sponsorNames: 'Sponsor',
          officiatingPriest: 'Fr. A',
          parishId: 10,
          parishName: 'St Mary',
        },
      ],
    });
    (fetchCommunions as jest.Mock).mockResolvedValue({
      content: [
        {
          id: 101,
          baptismId: 1,
          baptismName: 'John',
          otherNames: '',
          surname: 'Doe',
          communionDate: '2000-05-01',
          officiatingPriest: 'Fr. A',
          parish: 'St Mary',
        },
        {
          id: 102,
          baptismId: 2,
          baptismName: 'Jane',
          otherNames: '',
          surname: 'Smith',
          communionDate: '2002-05-01',
          officiatingPriest: 'Fr. A',
          parish: 'St Mary',
        },
      ],
    });
    (fetchConfirmations as jest.Mock).mockResolvedValue({ content: [] });
    (fetchParishMarriageRequirements as jest.Mock).mockResolvedValue({
      parishId: 10,
      requireMarriageConfirmation: false,
    });
    (createMarriageWithParties as jest.Mock).mockResolvedValue({ id: 99 });
  });

  it('shows form with heading and groom/bride sections', async () => {
    render(<MarriageCreatePage />);
    await waitFor(() => {
      expect(fetchBaptisms).toHaveBeenCalledWith(10);
      expect(fetchCommunions).toHaveBeenCalledWith(10);
    });
    await waitFor(() => {
      expect(fetchParishMarriageRequirements).toHaveBeenCalledWith(10);
    });
    await waitFor(() => {
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
    expect(screen.getAllByPlaceholderText(/select confirmation record/i)).toHaveLength(2);
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
    await user.type(screen.getByLabelText(/diocese/i), 'Enugu Diocese');
    await user.type(screen.getByLabelText(/officiating priest/i), 'Fr. Smith');
    // Groom/Bride mandatory fields
    const dobInputs = screen.getAllByLabelText(/date of birth/i);
    await user.type(dobInputs[0], '1990-01-01');
    await user.type(dobInputs[1], '1992-02-02');
    const maritalStatusInputs = screen.getAllByLabelText(/marital status/i);
    await user.selectOptions(maritalStatusInputs[0], 'Bachelor / Widower');
    await user.selectOptions(maritalStatusInputs[1], 'Single / Widow');
    const nationalityInputs = screen.getAllByLabelText(/nationality/i);
    await user.type(nationalityInputs[0], 'Nigerian');
    await user.type(nationalityInputs[1], 'Nigerian');
    const residentialAddressInputs = screen.getAllByLabelText(/residential address/i);
    await user.type(residentialAddressInputs[0], '12 Main Street');
    await user.type(residentialAddressInputs[1], '34 Second Street');

    // Baptism: select groom + bride baptism record (default mode is "In this parish")
    const baptismSearchInputs = screen.getAllByPlaceholderText(/select baptism record/i);
    // Groom baptism
    await user.type(baptismSearchInputs[0], 'John');
    const groomListItems = await screen.findAllByRole('listitem');
    const groomBaptismOption = groomListItems.find((li) => /John/i.test(li.textContent || ''));
    expect(groomBaptismOption).toBeTruthy();
    await user.click(groomBaptismOption as HTMLElement);
    // Bride baptism
    await user.type(baptismSearchInputs[1], 'Jane');
    const brideListItems = await screen.findAllByRole('listitem');
    const brideBaptismOption = brideListItems.find((li) => /Jane/i.test(li.textContent || ''));
    expect(brideBaptismOption).toBeTruthy();
    await user.click(brideBaptismOption as HTMLElement);

    const communionSearchInputs = screen.getAllByPlaceholderText(/select communion record/i);
    await user.type(communionSearchInputs[0], 'John');
    const groomCommunionItems = await screen.findAllByRole('listitem');
    const groomCommunionOption = groomCommunionItems.find((li) => /John/i.test(li.textContent || ''));
    expect(groomCommunionOption).toBeTruthy();
    await user.click(groomCommunionOption as HTMLElement);
    await user.type(communionSearchInputs[1], 'Jane');
    const brideCommunionItems = await screen.findAllByRole('listitem');
    const brideCommunionOption = brideCommunionItems.find((li) => /Jane/i.test(li.textContent || ''));
    expect(brideCommunionOption).toBeTruthy();
    await user.click(brideCommunionOption as HTMLElement);

    // Parish is pre-filled from context
    const main = screen.getByRole('main');
    const parishInput = within(main).getByLabelText(/parish \*/i);
    expect(parishInput).toHaveValue('St Mary');
    // Witness inputs: in the section that has "Minimum of 2 witnesses" (groom/bride also have placeholder "Full Name")
    const witnessesSection = screen.getByText(/minimum of 2 witnesses required/i).closest('div');
    const witnessNameInputs = witnessesSection ? within(witnessesSection as HTMLElement).getAllByPlaceholderText(/full name/i) : screen.getAllByPlaceholderText(/full name/i).slice(-2);
    await user.type(witnessNameInputs[0], 'Witness One');
    await user.type(witnessNameInputs[1], 'Witness Two');
    const saveMarriageButton = screen.getByRole('button', { name: /save marriage/i });
    await waitFor(() => {
      expect(saveMarriageButton).toBeEnabled();
    });
    await user.click(saveMarriageButton);

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

  it('when parish requires confirmation, save stays disabled until both confirmation records are selected', async () => {
    (fetchParishMarriageRequirements as jest.Mock).mockResolvedValue({
      parishId: 10,
      requireMarriageConfirmation: true,
    });
    (fetchConfirmations as jest.Mock).mockResolvedValue({
      content: [
        {
          id: 201,
          baptismName: 'John',
          otherNames: '',
          surname: 'Doe',
          confirmationDate: '2010-06-01',
          parishId: 10,
        },
        {
          id: 202,
          baptismName: 'Jane',
          otherNames: '',
          surname: 'Smith',
          confirmationDate: '2011-06-01',
          parishId: 10,
        },
      ],
    });

    const user = userEvent.setup();
    render(<MarriageCreatePage />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /create marriage record/i })).toBeInTheDocument();
    });

    expect(
      screen.getByText(/this parish also requires/i)
    ).toBeInTheDocument();

    const fullNameInputs = screen.getAllByLabelText(/full name/i);
    await user.type(fullNameInputs[0], 'John Doe');
    await user.type(fullNameInputs[1], 'Jane Smith');
    await user.type(screen.getByLabelText(/marriage date/i), '2025-06-15');
    await user.type(screen.getByLabelText(/church name/i), 'St Mary');
    await user.type(screen.getByLabelText(/diocese/i), 'Enugu Diocese');
    await user.type(screen.getByLabelText(/officiating priest/i), 'Fr. Smith');
    const dobInputs = screen.getAllByLabelText(/date of birth/i);
    await user.type(dobInputs[0], '1990-01-01');
    await user.type(dobInputs[1], '1992-02-02');
    const maritalStatusInputs = screen.getAllByLabelText(/marital status/i);
    await user.selectOptions(maritalStatusInputs[0], 'Bachelor / Widower');
    await user.selectOptions(maritalStatusInputs[1], 'Single / Widow');
    const nationalityInputs = screen.getAllByLabelText(/nationality/i);
    await user.type(nationalityInputs[0], 'Nigerian');
    await user.type(nationalityInputs[1], 'Nigerian');
    const residentialAddressInputs = screen.getAllByLabelText(/residential address/i);
    await user.type(residentialAddressInputs[0], '12 Main Street');
    await user.type(residentialAddressInputs[1], '34 Second Street');

    const baptismSearchInputs = screen.getAllByPlaceholderText(/select baptism record/i);
    await user.type(baptismSearchInputs[0], 'John');
    await user.click(
      (await screen.findAllByRole('listitem')).find((li) => /John/i.test(li.textContent || '')) as HTMLElement
    );
    await user.type(baptismSearchInputs[1], 'Jane');
    await user.click(
      (await screen.findAllByRole('listitem')).find((li) => /Jane/i.test(li.textContent || '')) as HTMLElement
    );

    const communionSearchInputs = screen.getAllByPlaceholderText(/select communion record/i);
    await user.type(communionSearchInputs[0], 'John');
    await user.click(
      (await screen.findAllByRole('listitem')).find((li) => /John/i.test(li.textContent || '')) as HTMLElement
    );
    await user.type(communionSearchInputs[1], 'Jane');
    await user.click(
      (await screen.findAllByRole('listitem')).find((li) => /Jane/i.test(li.textContent || '')) as HTMLElement
    );

    const witnessesSection = screen.getByText(/minimum of 2 witnesses required/i).closest('div');
    const witnessNameInputs = witnessesSection
      ? within(witnessesSection as HTMLElement).getAllByPlaceholderText(/full name/i)
      : screen.getAllByPlaceholderText(/full name/i).slice(-2);
    await user.type(witnessNameInputs[0], 'Witness One');
    await user.type(witnessNameInputs[1], 'Witness Two');

    const saveBtn = screen.getByRole('button', { name: /save marriage/i });
    expect(saveBtn).toBeDisabled();

    const confirmationSearchInputs = screen.getAllByPlaceholderText(/select confirmation record/i);
    await user.type(confirmationSearchInputs[0], 'John');
    await user.click(
      (await screen.findAllByRole('listitem')).find((li) => /John/i.test(li.textContent || '')) as HTMLElement
    );
    await user.type(confirmationSearchInputs[1], 'Jane');
    await user.click(
      (await screen.findAllByRole('listitem')).find((li) => /Jane/i.test(li.textContent || '')) as HTMLElement
    );

    await waitFor(() => {
      expect(saveBtn).not.toBeDisabled();
    });
  });

  it('when no parishId shows message', () => {
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams(''));
    (useParish as jest.Mock).mockReturnValue({
      ...defaultParishContext,
      parishId: null,
      parishes: [],
    });
    render(<MarriageCreatePage />);
    const main = screen.getByRole('main');
    expect(within(main).getByText(/select a parish from the marriages list/i)).toBeInTheDocument();
  });
});
