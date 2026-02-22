/**
 * TDD: Holy Order create page.
 * - When authenticated and parishId in query, shows form (confirmation picker, date, order type, bishop) and creates on submit
 * - Redirects to list after successful create
 */
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter, useSearchParams } from 'next/navigation';
import HolyOrderCreatePage from '@/app/holy-orders/new/page';
import { getStoredToken, getStoredUser, fetchConfirmations, createHolyOrder } from '@/lib/api';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock('@/lib/api', () => ({
  getStoredToken: jest.fn(),
  getStoredUser: jest.fn(),
  fetchConfirmations: jest.fn(),
  createHolyOrder: jest.fn(),
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

describe('Holy Order create page', () => {
  beforeEach(() => {
    mockPush.mockClear();
    (getStoredToken as jest.Mock).mockReturnValue('token');
    (getStoredUser as jest.Mock).mockReturnValue({ username: 'admin', displayName: 'Admin', role: 'ADMIN' });
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('parishId=10'));
    (fetchConfirmations as jest.Mock).mockResolvedValue([
      { id: 7, baptismId: 5, communionId: 2, confirmationDate: '2025-04-01', officiatingBishop: 'Bishop Jones', parish: 'St Mary' },
    ]);
    (createHolyOrder as jest.Mock).mockResolvedValue({ id: 99, confirmationId: 7, orderType: 'PRIEST' });
  });

  it('shows form with heading and required fields', async () => {
    render(<HolyOrderCreatePage />);
    await waitFor(() => {
      expect(fetchConfirmations).toHaveBeenCalledWith(10);
    });
    expect(screen.getByRole('heading', { name: /new holy order|add holy order/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/confirmation|select confirmation/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/ordination date|date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/order type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/officiating bishop|bishop/i)).toBeInTheDocument();
  });

  it('on submit creates holy order and redirects to list', async () => {
    const user = userEvent.setup();
    render(<HolyOrderCreatePage />);
    await waitFor(() => {
      expect(fetchConfirmations).toHaveBeenCalled();
    });
    await user.selectOptions(screen.getByLabelText(/confirmation|select confirmation/i), '7');
    await user.type(screen.getByLabelText(/ordination date|date/i), '2025-09-01');
    await user.selectOptions(screen.getByLabelText(/order type/i), 'PRIEST');
    await user.type(screen.getByLabelText(/officiating bishop|bishop/i), 'Bishop Jones');
    await user.click(screen.getByRole('button', { name: /save|create|submit/i }));

    await waitFor(() => {
      expect(createHolyOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          confirmationId: 7,
          ordinationDate: '2025-09-01',
          orderType: 'PRIEST',
          officiatingBishop: 'Bishop Jones',
        })
      );
    });
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/holy-orders');
    });
  });

  it('when no parishId shows message', () => {
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams(''));
    render(<HolyOrderCreatePage />);
    const main = screen.getByRole('main');
    expect(within(main).getByText(/select a parish from the holy orders list/i)).toBeInTheDocument();
  });
});
