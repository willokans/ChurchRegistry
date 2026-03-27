/**
 * Offline draft UX (Save Draft / Resume draft / Discard) for Communions.
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import CommunionCreatePage from '@/app/communions/new/page';
import { getStoredToken, getStoredUser, fetchBaptisms, createCommunion, createCommunionWithCertificate } from '@/lib/api';
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
  createCommunion: jest.fn(),
  createCommunionWithCertificate: jest.fn(),
}));

jest.mock('@/context/ParishContext', () => ({
  useParish: jest.fn(),
}));

const mockPush = jest.fn();

describe('Communion create page offline drafts', () => {
  const originalIndexedDB = (globalThis as unknown as { indexedDB?: unknown }).indexedDB;

  beforeAll(() => {
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (usePathname as jest.Mock).mockReturnValue('/communions/new');
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
    (createCommunion as jest.Mock).mockResolvedValue({ id: 99 });
    (createCommunionWithCertificate as jest.Mock).mockResolvedValue({ id: 100 });
  });

  afterAll(() => {
    (globalThis as unknown as { indexedDB?: unknown }).indexedDB = originalIndexedDB;
  });

  it('shows Save Draft banner, restores values on Resume, and removes draft on Discard', async () => {
    const user = userEvent.setup();
    const draftKey = 'church_registry_offline_draft:communion_create:10:admin';

    render(<CommunionCreatePage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save draft/i })).toBeInTheDocument();
    });

    // Fill a couple of external baptism fields.
    const baptismName = screen.getByLabelText(/baptism name/i);
    const baptismSurname = screen.getByLabelText(/surname/i);
    await user.clear(baptismName);
    await user.type(baptismName, 'Jane Baptism');
    await user.clear(baptismSurname);
    await user.type(baptismSurname, 'Doe');

    await user.click(screen.getByRole('button', { name: /save draft/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /resume draft/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /discard/i })).toBeInTheDocument();
    });

    expect(window.localStorage.getItem(draftKey)).not.toBeNull();

    // Mutate values, then resume should restore.
    await user.clear(baptismName);
    await user.type(baptismName, 'Changed Name');
    await user.click(screen.getByRole('button', { name: /resume draft/i }));

    expect(baptismName).toHaveValue('Jane Baptism');
    expect(baptismSurname).toHaveValue('Doe');

    await user.click(screen.getByRole('button', { name: /discard/i }));
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /resume draft/i })).not.toBeInTheDocument();
    });

    expect(window.localStorage.getItem(draftKey)).toBeNull();
  });
});

