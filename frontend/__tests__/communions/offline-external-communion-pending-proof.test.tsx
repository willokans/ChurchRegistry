/**
 * Offline enqueue + replay for external-baptism Communion creates:
 * - No certificate: payload omits certificateAttachment; replay uses createCommunionWithExternalBaptismPendingProof.
 * - With certificate: payload includes certificateAttachment; replay uses createCommunionWithCertificate.
 */
import type { ReactNode } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter, useSearchParams } from 'next/navigation';
import CommunionCreateContent from '@/app/communions/new/CommunionCreateContent';
import { fetchBaptisms, getStoredUser, createCommunionWithCertificate, createCommunionWithExternalBaptismPendingProof } from '@/lib/api';
import { useNetworkStatus } from '@/lib/offline/network';
import { listOfflineQueueItems } from '@/lib/offline/queue';
import { replayOfflineQueue } from '@/lib/offline/replay';
import { useParish } from '@/context/ParishContext';
import { defaultParishContext } from '../test-utils';

jest.mock('@/components/AuthenticatedLayout', () => ({
  __esModule: true,
  default: function AuthenticatedLayout({ children }: { children: ReactNode }) {
    return <>{children}</>;
  },
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
  usePathname: jest.fn(() => '/communions/new'),
}));

jest.mock('@/lib/api', () => ({
  fetchBaptisms: jest.fn(),
  getStoredUser: jest.fn(),
  createCommunion: jest.fn(),
  createCommunionWithCertificate: jest.fn(),
  createCommunionWithExternalBaptismPendingProof: jest.fn(),
}));

jest.mock('@/context/ParishContext', () => ({
  useParish: jest.fn(),
}));

jest.mock('@/lib/offline/network', () => ({
  ...(jest.requireActual('@/lib/offline/network') as object),
  useNetworkStatus: jest.fn(),
}));

describe('offline external communion create (pending proof vs certificate)', () => {
  const originalIndexedDB = (globalThis as unknown as { indexedDB?: unknown }).indexedDB;
  const mockPush = jest.fn();

  beforeEach(() => {
    (globalThis as unknown as { indexedDB?: unknown }).indexedDB = undefined;
    window.localStorage.clear();
    Object.defineProperty(window.navigator, 'onLine', { configurable: true, value: true });

    mockPush.mockClear();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('parishId=10'));
    (useParish as jest.Mock).mockReturnValue(defaultParishContext);
    (getStoredUser as jest.Mock).mockReturnValue({ username: 'admin', displayName: 'Admin', role: 'ADMIN' });
    (fetchBaptisms as jest.Mock).mockResolvedValue({ content: [] });
    (useNetworkStatus as jest.Mock).mockReturnValue({ isOnline: false });
    (createCommunionWithExternalBaptismPendingProof as jest.Mock).mockReset();
    (createCommunionWithCertificate as jest.Mock).mockReset();
    (createCommunionWithExternalBaptismPendingProof as jest.Mock).mockResolvedValue({
      id: 501,
      baptismCertificatePending: true,
    });
    (createCommunionWithCertificate as jest.Mock).mockResolvedValue({ id: 502, baptismId: 50 });
  });

  afterAll(() => {
    (globalThis as unknown as { indexedDB?: unknown }).indexedDB = originalIndexedDB;
  });

  it('enqueues communion_create without certificateAttachment and replays via pending-proof API', async () => {
    const user = userEvent.setup();
    render(<CommunionCreateContent />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /communion details/i })).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/baptism name/i), 'John');
    await user.type(screen.getByLabelText(/^surname$/i), 'Smith');
    await user.selectOptions(screen.getByLabelText(/gender/i), 'MALE');
    await user.type(screen.getByLabelText(/father's name/i), 'James Smith');
    await user.type(screen.getByLabelText(/mother's name/i), 'Mary Smith');
    await user.type(screen.getByLabelText(/baptised church address/i), 'Elsewhere Parish');

    await user.type(screen.getByLabelText(/communion date/i), '2024-06-01');
    await user.type(screen.getByLabelText(/officiating priest/i), 'Fr. Lee');
    await user.selectOptions(screen.getByRole('combobox', { name: /mass venue/i }), 'St Mary');

    const saveBtn = screen.getByRole('button', { name: /save.*register communion|register communion/i });
    await waitFor(() => expect(saveBtn).not.toBeDisabled());
    await user.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByText(/queued for sync/i)).toBeInTheDocument();
    });

    const queued = await listOfflineQueueItems({ status: 'queued' });
    expect(queued.length).toBe(1);
    const payload = queued[0].submission.payload as Record<string, unknown>;
    expect(payload.baptismSource).toBe('external');
    expect(payload).not.toHaveProperty('certificateAttachment');

    await act(async () => {
      await replayOfflineQueue({ onlyItemId: queued[0].id });
    });

    expect(createCommunionWithExternalBaptismPendingProof).toHaveBeenCalledTimes(1);
    expect(createCommunionWithExternalBaptismPendingProof).toHaveBeenCalledWith(
      10,
      expect.objectContaining({
        communionDate: '2024-06-01',
        officiatingPriest: 'Fr. Lee',
        parish: 'St Mary',
      }),
      expect.objectContaining({
        baptismName: 'John',
        surname: 'Smith',
        fathersName: 'James Smith',
        mothersName: 'Mary Smith',
        baptisedChurchAddress: 'Elsewhere Parish',
      })
    );
    expect(createCommunionWithCertificate).not.toHaveBeenCalled();
  });

  it('offline external communion with certificate enqueues certificateAttachment and replays via createCommunionWithCertificate', async () => {
    const user = userEvent.setup();
    render(<CommunionCreateContent />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /communion details/i })).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/baptism name/i), 'John');
    await user.type(screen.getByLabelText(/^surname$/i), 'Smith');
    await user.selectOptions(screen.getByLabelText(/gender/i), 'MALE');
    await user.type(screen.getByLabelText(/father's name/i), 'James Smith');
    await user.type(screen.getByLabelText(/mother's name/i), 'Mary Smith');
    await user.type(screen.getByLabelText(/baptised church address/i), 'Elsewhere Parish');

    const file = new File(['%PDF-1.4'], 'baptism-cert.pdf', { type: 'application/pdf' });
    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).toBeTruthy();
    fireEvent.change(fileInput!, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('baptism-cert.pdf')).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/communion date/i), '2024-06-02');
    await user.type(screen.getByLabelText(/officiating priest/i), 'Fr. Kim');
    await user.selectOptions(screen.getByRole('combobox', { name: /mass venue/i }), 'St Mary');

    const saveBtn = screen.getByRole('button', { name: /save.*register communion|register communion/i });
    await waitFor(() => expect(saveBtn).not.toBeDisabled());
    await user.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByText(/queued for sync/i)).toBeInTheDocument();
    });

    const queued = await listOfflineQueueItems({ status: 'queued' });
    expect(queued.length).toBe(1);
    const payload = queued[0].submission.payload as Record<string, unknown>;
    expect(payload.baptismSource).toBe('external');
    expect(payload).toHaveProperty('certificateAttachment');
    const certRef = payload.certificateAttachment as { fileRefId?: string };
    expect(typeof certRef?.fileRefId).toBe('string');
    expect(certRef.fileRefId!.length).toBeGreaterThan(0);

    await act(async () => {
      await replayOfflineQueue({ onlyItemId: queued[0].id });
    });

    expect(createCommunionWithCertificate).toHaveBeenCalledTimes(1);
    expect(createCommunionWithCertificate).toHaveBeenCalledWith(
      10,
      expect.objectContaining({
        communionDate: '2024-06-02',
        officiatingPriest: 'Fr. Kim',
        parish: 'St Mary',
      }),
      expect.any(File),
      expect.objectContaining({
        baptismName: 'John',
        surname: 'Smith',
        fathersName: 'James Smith',
        mothersName: 'Mary Smith',
        baptisedChurchAddress: 'Elsewhere Parish',
      })
    );
    expect(createCommunionWithExternalBaptismPendingProof).not.toHaveBeenCalled();
  });
});
