/**
 * TDD: Confirmation create page.
 * - When authenticated and parishId in query, shows form (communion picker, date, bishop, parish) and creates on submit
 * - Redirects to list after successful create
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter, useSearchParams } from 'next/navigation';
import ConfirmationCreatePage from '@/app/confirmations/new/page';
import { getStoredToken, getStoredUser, fetchCommunions, createConfirmation } from '@/lib/api';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock('@/lib/api', () => ({
  getStoredToken: jest.fn(),
  getStoredUser: jest.fn(),
  fetchCommunions: jest.fn(),
  createConfirmation: jest.fn(),
}));

const mockPush = jest.fn();
(useRouter as jest.Mock).mockReturnValue({ push: mockPush });

describe('Confirmation create page', () => {
  beforeEach(() => {
    mockPush.mockClear();
    (getStoredToken as jest.Mock).mockReturnValue('token');
    (getStoredUser as jest.Mock).mockReturnValue({ username: 'admin', displayName: 'Admin', role: 'ADMIN' });
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('parishId=10'));
    (fetchCommunions as jest.Mock).mockResolvedValue([
      { id: 2, baptismId: 5, communionDate: '2024-05-01', officiatingPriest: 'Fr. Smith', parish: 'St Mary' },
    ]);
    (createConfirmation as jest.Mock).mockResolvedValue({ id: 99, communionId: 2, confirmationDate: '2025-04-01' });
  });

  it('shows form with heading and required fields', async () => {
    render(<ConfirmationCreatePage />);
    await waitFor(() => {
      expect(fetchCommunions).toHaveBeenCalledWith(10);
    });
    expect(screen.getByRole('heading', { name: /new confirmation|add confirmation/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/communion|select communion/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirmation date|date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/officiating bishop|bishop/i)).toBeInTheDocument();
  });

  it('on submit creates confirmation and redirects to list', async () => {
    const user = userEvent.setup();
    render(<ConfirmationCreatePage />);
    await waitFor(() => {
      expect(fetchCommunions).toHaveBeenCalled();
    });
    await user.selectOptions(screen.getByLabelText(/communion|select communion/i), '2');
    await user.type(screen.getByLabelText(/confirmation date|date/i), '2025-04-01');
    await user.type(screen.getByLabelText(/officiating bishop|bishop/i), 'Bishop Jones');
    await user.click(screen.getByRole('button', { name: /save|create|submit/i }));

    await waitFor(() => {
      expect(createConfirmation).toHaveBeenCalledWith(
        expect.objectContaining({
          communionId: 2,
          confirmationDate: '2025-04-01',
          officiatingBishop: 'Bishop Jones',
        })
      );
    });
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/confirmations');
    });
  });

  it('when no parishId shows message', () => {
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams(''));
    render(<ConfirmationCreatePage />);
    expect(screen.getByText(/parish|select parish/i)).toBeInTheDocument();
  });
});
