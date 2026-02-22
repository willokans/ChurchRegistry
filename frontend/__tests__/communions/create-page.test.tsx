/**
 * TDD: First Holy Communion create page.
 * - When authenticated and parishId in query, shows form (baptism picker, date, priest, parish) and creates on submit
 * - Redirects to list after successful create
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter, useSearchParams } from 'next/navigation';
import CommunionCreatePage from '@/app/communions/new/page';
import { getStoredToken, getStoredUser, fetchBaptisms, createCommunion } from '@/lib/api';

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

const mockPush = jest.fn();
(useRouter as jest.Mock).mockReturnValue({ push: mockPush });

describe('Communion create page', () => {
  beforeEach(() => {
    mockPush.mockClear();
    (getStoredToken as jest.Mock).mockReturnValue('token');
    (getStoredUser as jest.Mock).mockReturnValue({ username: 'admin', displayName: 'Admin', role: 'ADMIN' });
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('parishId=10'));
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
    expect(screen.getByRole('heading', { name: /new communion|add communion/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/baptism|select baptism/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/communion date|date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/officiating priest|priest/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/parish/i)).toBeInTheDocument();
  });

  it('on submit creates communion and redirects to list', async () => {
    const user = userEvent.setup();
    render(<CommunionCreatePage />);
    await waitFor(() => {
      expect(fetchBaptisms).toHaveBeenCalled();
    });
    await user.selectOptions(screen.getByLabelText(/baptism|select baptism/i), '5');
    await user.type(screen.getByLabelText(/communion date|date/i), '2024-05-01');
    await user.type(screen.getByLabelText(/officiating priest|priest/i), 'Fr. Smith');
    await user.type(screen.getByLabelText(/parish/i), 'St Mary');
    await user.click(screen.getByRole('button', { name: /save|create|submit/i }));

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

  it('when no parishId shows message', () => {
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams(''));
    render(<CommunionCreatePage />);
    expect(screen.getByText(/parish|select parish/i)).toBeInTheDocument();
  });
});
