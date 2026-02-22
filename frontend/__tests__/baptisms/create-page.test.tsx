/**
 * TDD: Baptism create page.
 * - When authenticated and parishId in query, shows form and creates on submit
 * - Redirects to list or view after successful create
 */
import { render, screen, waitFor } from '@testing-library/react';
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
    expect(screen.getByLabelText(/surname|last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/date of birth/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/father|father's name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/mother|mother's name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/sponsor/i)).toBeInTheDocument();
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
    const genderSelect = screen.getByLabelText(/gender/i);
    await user.selectOptions(genderSelect, screen.getByRole('option', { name: /female/i }) || genderSelect.querySelector('option[value="FEMALE"]'));
    await user.click(screen.getByRole('button', { name: /save|create|submit/i }));

    await waitFor(() => {
      expect(createBaptism).toHaveBeenCalledWith(10, expect.objectContaining({
        baptismName: 'Jane',
        surname: 'Doe',
        fathersName: 'John',
        mothersName: 'Mary',
        sponsorNames: 'Peter',
      }));
    });
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/baptisms');
    });
  });

  it('when no parishId shows message', () => {
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams(''));
    render(<BaptismCreatePage />);
    expect(screen.getByText(/parish|select parish/i)).toBeInTheDocument();
  });
});
