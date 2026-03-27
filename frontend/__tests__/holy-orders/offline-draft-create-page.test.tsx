/**
 * Offline draft UX (Save Draft / Resume draft / Discard) for Holy Orders.
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import HolyOrderCreatePage from '@/app/holy-orders/new/page';
import { getStoredToken, getStoredUser, fetchConfirmations, createHolyOrder } from '@/lib/api';
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
  fetchConfirmations: jest.fn(),
  createHolyOrder: jest.fn(),
}));

jest.mock('@/context/ParishContext', () => ({
  useParish: jest.fn(),
}));

const mockPush = jest.fn();

describe('Holy order create page offline drafts', () => {
  const originalIndexedDB = (globalThis as unknown as { indexedDB?: unknown }).indexedDB;

  beforeAll(() => {
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (usePathname as jest.Mock).mockReturnValue('/holy-orders/new');
  });

  beforeEach(() => {
    // Force localStorage fallback to keep draft persistence deterministic.
    (globalThis as unknown as { indexedDB?: unknown }).indexedDB = undefined;
    window.localStorage.clear();

    mockPush.mockClear();

    (getStoredToken as jest.Mock).mockReturnValue('token');
    (getStoredUser as jest.Mock).mockReturnValue({ username: 'admin', displayName: 'Admin', role: 'ADMIN' });
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('parishId=10'));
    (useParish as jest.Mock).mockReturnValue(defaultParishContext);

    (fetchConfirmations as jest.Mock).mockResolvedValue({
      content: [
        { id: 7, baptismId: 5, communionId: 2, confirmationDate: '2025-04-01', officiatingBishop: 'Bishop Jones', parish: 'St Mary' },
      ],
    });

    (createHolyOrder as jest.Mock).mockResolvedValue({ id: 99, confirmationId: 7, orderType: 'PRIEST' });
  });

  afterAll(() => {
    (globalThis as unknown as { indexedDB?: unknown }).indexedDB = originalIndexedDB;
  });

  it('shows Save Draft banner, restores values on Resume, and removes draft on Discard', async () => {
    const user = userEvent.setup();
    const draftKey = 'church_registry_offline_draft:holy_order_create:10:admin';

    render(<HolyOrderCreatePage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save draft/i })).toBeInTheDocument();
    });

    const ordinationDate = screen.getByLabelText(/ordination date|date/i, { selector: '#ordinationDate' }) as HTMLInputElement;
    const officiatingBishop = screen.getByLabelText(/officiating bishop|bishop/i, { selector: '#officiatingBishop' }) as HTMLInputElement;

    await user.clear(ordinationDate);
    await user.type(ordinationDate, '2025-09-01');
    await user.clear(officiatingBishop);
    await user.type(officiatingBishop, 'Bishop Jones');

    await user.click(screen.getByRole('button', { name: /save draft/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /resume draft/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /discard/i })).toBeInTheDocument();
    });

    expect(window.localStorage.getItem(draftKey)).not.toBeNull();

    await user.clear(officiatingBishop);
    await user.type(officiatingBishop, 'Changed Bishop');
    await user.click(screen.getByRole('button', { name: /resume draft/i }));

    expect(officiatingBishop).toHaveValue('Bishop Jones');

    await user.click(screen.getByRole('button', { name: /discard/i }));
    await waitFor(() => {
      expect(window.localStorage.getItem(draftKey)).toBeNull();
    });
  });
});

