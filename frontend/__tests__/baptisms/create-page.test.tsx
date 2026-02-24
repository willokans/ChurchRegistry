/**
 * TDD: Baptism create page.
 * - When authenticated and parishId in query, shows form and creates on submit
 * - Redirects to list or view after successful create
 */
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter, useSearchParams } from 'next/navigation';
import BaptismCreatePage from '@/app/baptisms/new/page';
import { getStoredToken, getStoredUser, createBaptism } from '@/lib/api';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock('@/lib/api', () => ({
  getStoredToken: jest.fn(),
  getStoredUser: jest.fn(),
  createBaptism: jest.fn(),
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

describe('Baptism create page', () => {
  beforeEach(() => {
    mockPush.mockClear();
    (getStoredToken as jest.Mock).mockReturnValue('token');
    (getStoredUser as jest.Mock).mockReturnValue({ username: 'admin', displayName: 'Admin', role: 'ADMIN' });
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('parishId=10'));
    (createBaptism as jest.Mock).mockResolvedValue({ id: 99, baptismName: 'Jane', surname: 'Doe' });
  });

  it('shows form with heading and required fields', () => {
    render(<BaptismCreatePage />);
    expect(screen.getByRole('heading', { name: /new baptism|add baptism/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/baptism name|first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/other names/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/surname|last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/date of birth/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/father|father's name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/mother|mother's name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/sponsor/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/officiating priest/i)).toBeInTheDocument();
  });

  it('on submit creates baptism and redirects to list', async () => {
    const user = userEvent.setup();
    render(<BaptismCreatePage />);
    await user.type(screen.getByLabelText(/baptism name|first name/i), 'Jane');
    await user.type(screen.getByLabelText(/surname|last name/i), 'Doe');
    await user.type(screen.getByLabelText(/date of birth/i), '2021-05-10');
    await user.type(screen.getByLabelText(/father|father's name/i), 'John');
    await user.type(screen.getByLabelText(/mother|mother's name/i), 'Mary');
    await user.type(screen.getByLabelText(/sponsor/i), 'Peter');
    await user.type(screen.getByLabelText(/officiating priest/i), 'Fr. Smith');
    await user.type(screen.getByLabelText(/address line/i), '10 Main St');
    await user.selectOptions(screen.getByLabelText(/state \(nigeria\)/i), 'Lagos');
    const genderSelect = screen.getByLabelText(/gender/i);
    await user.selectOptions(genderSelect, screen.getByRole('option', { name: /female/i }) || genderSelect.querySelector('option[value="FEMALE"]'));
    await user.click(screen.getByRole('button', { name: /save|create|submit/i }));

    await waitFor(() => {
      expect(createBaptism).toHaveBeenCalledWith(10, expect.objectContaining({
        baptismName: 'Jane',
        otherNames: '',
        surname: 'Doe',
        fathersName: 'John',
        mothersName: 'Mary',
        sponsorNames: 'Peter',
        officiatingPriest: 'Fr. Smith',
        parentAddress: '10 Main St, Lagos',
      }));
    });
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/baptisms');
    });
  });

  it('when no parishId shows message', () => {
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams(''));
    render(<BaptismCreatePage />);
    const main = screen.getByRole('main');
    expect(within(main).getByText(/select a parish from the baptisms list/i)).toBeInTheDocument();
  });

  it('shows Parents address section with Address line above State (Nigeria)', () => {
    render(<BaptismCreatePage />);
    expect(screen.getByText(/parents'? address/i)).toBeInTheDocument();
    const addressLine = screen.getByLabelText(/address line/i);
    const stateSelect = screen.getByLabelText(/state \(nigeria\)/i);
    expect(addressLine).toBeInTheDocument();
    expect(stateSelect).toBeInTheDocument();
    const form = addressLine.closest('form');
    const inputs = form?.querySelectorAll('input, select') ?? [];
    const addressLineIdx = Array.from(inputs).findIndex((el) => el.id === 'parentAddressLine');
    const stateIdx = Array.from(inputs).findIndex((el) => el.id === 'parentAddressState');
    expect(addressLineIdx).toBeGreaterThanOrEqual(0);
    expect(stateIdx).toBeGreaterThanOrEqual(0);
    expect(addressLineIdx).toBeLessThan(stateIdx);
  });

  it('Address line and State are required', () => {
    render(<BaptismCreatePage />);
    const addressLine = screen.getByLabelText(/address line/i);
    const stateSelect = screen.getByLabelText(/state \(nigeria\)/i);
    expect(addressLine).toBeRequired();
    expect(stateSelect).toBeRequired();
  });

  it('date of birth input has max set so future dates cannot be selected', () => {
    render(<BaptismCreatePage />);
    const dobInput = screen.getByLabelText(/date of birth/i);
    expect(dobInput).toHaveAttribute('max');
    expect(dobInput.getAttribute('max')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('on submit saves parent address as "Address line, State" in parentAddress', async () => {
    const user = userEvent.setup();
    render(<BaptismCreatePage />);
    await user.type(screen.getByLabelText(/baptism name|first name/i), 'Jane');
    await user.type(screen.getByLabelText(/surname|last name/i), 'Doe');
    await user.type(screen.getByLabelText(/date of birth/i), '2021-05-10');
    await user.type(screen.getByLabelText(/father|father's name/i), 'John');
    await user.type(screen.getByLabelText(/mother|mother's name/i), 'Mary');
    await user.type(screen.getByLabelText(/sponsor/i), 'Peter');
    await user.type(screen.getByLabelText(/officiating priest/i), 'Fr. Jones');
    await user.type(screen.getByLabelText(/address line/i), '10 Main St, Ikeja');
    await user.selectOptions(screen.getByLabelText(/state \(nigeria\)/i), 'Lagos');
    const genderSelect = screen.getByLabelText(/gender/i);
    await user.selectOptions(genderSelect, screen.getByRole('option', { name: /female/i }) || genderSelect.querySelector('option[value="FEMALE"]'));
    await user.click(screen.getByRole('button', { name: /save|create|submit/i }));

    await waitFor(() => {
      expect(createBaptism).toHaveBeenCalledWith(10, expect.objectContaining({
        parentAddress: '10 Main St, Ikeja, Lagos',
      }));
    });
  });
});
