/**
 * Offline draft UX (Save Draft / Resume draft / Discard) for Marriages.
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
  uploadMarriageCertificate,
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

describe('Marriage create page offline drafts', () => {
  const originalIndexedDB = (globalThis as unknown as { indexedDB?: unknown }).indexedDB;

  beforeAll(() => {
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (usePathname as jest.Mock).mockReturnValue('/marriages/new');
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

    (fetchBaptisms as jest.Mock).mockResolvedValue({ content: [] });
    (fetchCommunions as jest.Mock).mockResolvedValue({ content: [] });
    (fetchConfirmations as jest.Mock).mockResolvedValue({ content: [] });
    (fetchParishMarriageRequirements as jest.Mock).mockResolvedValue({
      parishId: 10,
      requireMarriageConfirmation: false,
    });

    (createMarriageWithParties as jest.Mock).mockResolvedValue({ id: 99 });
    (uploadMarriageCertificate as jest.Mock).mockResolvedValue({ path: '/cert' });
  });

  afterAll(() => {
    (globalThis as unknown as { indexedDB?: unknown }).indexedDB = originalIndexedDB;
  });

  it('shows Save Draft banner, restores values on Resume, and removes draft on Discard', async () => {
    const user = userEvent.setup();
    const draftKey = 'church_registry_offline_draft:marriage_create:10:admin';

    render(<MarriageCreatePage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save draft/i })).toBeInTheDocument();
    });

    const groomFullName = document.getElementById('groom-fullName') as HTMLInputElement;
    if (!groomFullName) throw new Error('Missing #groom-fullName input');
    await user.clear(groomFullName);
    await user.type(groomFullName, 'John Doe');

    await user.click(screen.getByRole('button', { name: /save draft/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /resume draft/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /discard/i })).toBeInTheDocument();
    });

    expect(window.localStorage.getItem(draftKey)).not.toBeNull();

    await user.clear(groomFullName);
    await user.type(groomFullName, 'Changed Groom');
    await user.click(screen.getByRole('button', { name: /resume draft/i }));

    expect(groomFullName).toHaveValue('John Doe');

    await user.click(screen.getByRole('button', { name: /discard/i }));
    await waitFor(() => {
      expect(window.localStorage.getItem(draftKey)).toBeNull();
    });
  });
});

