/**
 * Offline draft UX (Save Draft / Resume draft / Discard) for Confirmations.
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import ConfirmationCreatePage from '@/app/confirmations/new/page';
import {
  getStoredToken,
  getStoredUser,
  fetchBaptisms,
  fetchCommunions,
  createConfirmation,
  createBaptismWithCertificate,
  createCommunion,
  createCommunionWithCommunionCertificate,
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
  createConfirmation: jest.fn(),
  createBaptismWithCertificate: jest.fn(),
  createCommunion: jest.fn(),
  createCommunionWithCommunionCertificate: jest.fn(),
}));

jest.mock('@/context/ParishContext', () => ({
  useParish: jest.fn(),
}));

const mockPush = jest.fn();

describe('Confirmation create page offline drafts', () => {
  const originalIndexedDB = (globalThis as unknown as { indexedDB?: unknown }).indexedDB;

  beforeAll(() => {
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (usePathname as jest.Mock).mockReturnValue('/confirmations/new');
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

    // Empty baptisms -> page switches to external baptism mode.
    (fetchBaptisms as jest.Mock).mockResolvedValue({ content: [] });
    (fetchCommunions as jest.Mock).mockResolvedValue({ content: [] });

    (createConfirmation as jest.Mock).mockResolvedValue({ id: 99 });
    (createBaptismWithCertificate as jest.Mock).mockResolvedValue({ id: 50, certificatePath: '/cert' });
    (createCommunion as jest.Mock).mockResolvedValue({ id: 101 });
    (createCommunionWithCommunionCertificate as jest.Mock).mockResolvedValue({ id: 102 });
  });

  afterAll(() => {
    (globalThis as unknown as { indexedDB?: unknown }).indexedDB = originalIndexedDB;
  });

  it('shows Save Draft banner, restores values on Resume, and removes draft on Discard', async () => {
    const user = userEvent.setup();
    const draftKey = 'church_registry_offline_draft:confirmation_create:10:admin';

    render(<ConfirmationCreatePage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save draft/i })).toBeInTheDocument();
    });

    // Switch communion source to "another church" so external communion fields appear.
    await user.click(screen.getByRole('radio', { name: /holy communion in another church/i }));

    // Fill external baptism + external communion fields.
    const baptismName = screen.getByLabelText(/baptism name/i, { selector: '#external-baptismName' }) as HTMLInputElement;
    const baptismSurname = screen.getByLabelText(/surname/i, { selector: '#external-surname' }) as HTMLInputElement;
    await user.clear(baptismName);
    await user.type(baptismName, 'James Baptism');
    await user.clear(baptismSurname);
    await user.type(baptismSurname, 'Smith');

    const otherCommunionOfficiatingPriest = screen.getByLabelText(/officiating priest/i, { selector: '#other-officiatingPriest' }) as HTMLInputElement;
    await user.clear(otherCommunionOfficiatingPriest);
    await user.type(otherCommunionOfficiatingPriest, 'Bishop James');

    await user.click(screen.getByRole('button', { name: /save draft/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /resume draft/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /discard/i })).toBeInTheDocument();
    });

    expect(window.localStorage.getItem(draftKey)).not.toBeNull();

    // Mutate values, then resume should restore.
    await user.clear(baptismSurname);
    await user.type(baptismSurname, 'Changed Surname');
    await user.click(screen.getByRole('button', { name: /resume draft/i }));

    expect(baptismSurname).toHaveValue('Smith');

    await user.click(screen.getByRole('button', { name: /discard/i }));
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /resume draft/i })).not.toBeInTheDocument();
    });

    expect(window.localStorage.getItem(draftKey)).toBeNull();
  });
});

