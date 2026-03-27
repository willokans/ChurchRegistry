import React from 'react';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import { createBaptism, createBaptismWithCertificate, createCommunion, createCommunionWithCertificate, createConfirmation, createHolyOrder, type HolyOrderRequest } from '@/lib/api';
import { enqueueOfflineSubmission, getOfflineQueueItem, updateOfflineQueueItemStatus } from '@/lib/offline/queue';
import { useOfflineQueueReplayer } from '@/lib/offline/useOfflineQueueReplayer';
import RetryFailedSubmissionsBanner from '@/components/offline/RetryFailedSubmissionsBanner';
import type { OfflineQueueItem } from '@/lib/offline/queue';

jest.mock('@/lib/api', () => ({
  createBaptism: jest.fn(),
  createBaptismWithCertificate: jest.fn(),
  createCommunion: jest.fn(),
  createCommunionWithCertificate: jest.fn(),
  createCommunionWithCommunionCertificate: jest.fn(),
  createConfirmation: jest.fn(),
  createMarriageWithParties: jest.fn(),
  createHolyOrder: jest.fn(),
}));

function HookTester() {
  useOfflineQueueReplayer();
  return <div>hook-mounted</div>;
}

describe('offline queue replay triggers (no Background Sync)', () => {
  const originalIndexedDB = (globalThis as unknown as { indexedDB?: unknown }).indexedDB;

  beforeEach(() => {
    // Force localStorage fallback to keep tests deterministic.
    (globalThis as unknown as { indexedDB?: unknown }).indexedDB = undefined;
    window.localStorage.clear();

    // Ensure replay sees we're online/offline based on each test.
    Object.defineProperty(window.navigator, 'onLine', { configurable: true, value: true });

    (createHolyOrder as jest.Mock).mockReset();
    (createBaptism as jest.Mock).mockReset();
    (createBaptismWithCertificate as jest.Mock).mockReset();
    (createCommunion as jest.Mock).mockReset();
    (createCommunionWithCertificate as jest.Mock).mockReset();
    (createConfirmation as jest.Mock).mockReset();
  });

  afterAll(() => {
    (globalThis as unknown as { indexedDB?: unknown }).indexedDB = originalIndexedDB;
  });

  const holyOrderPayload: HolyOrderRequest = {
    confirmationId: 123,
    ordinationDate: '2026-03-20',
    orderType: 'DEACON',
    officiatingBishop: 'Bishop X',
    parishId: undefined,
  };

  async function expectItemStatus(itemId: string, status: OfflineQueueItem['status']) {
    await waitFor(async () => {
      const updated = await getOfflineQueueItem(itemId);
      expect(updated).not.toBeNull();
      expect(updated!.status).toBe(status);
    });
  }

  it('replays queued submissions on app reopen (mount)', async () => {
    (createHolyOrder as jest.Mock).mockResolvedValue({ id: 1 });

    const itemId = await enqueueOfflineSubmission({ kind: 'holy_order_create', payload: holyOrderPayload });

    render(<HookTester />);

    await expectItemStatus(itemId, 'synced');
    expect(createHolyOrder).toHaveBeenCalledTimes(1);
    expect(createHolyOrder).toHaveBeenCalledWith(holyOrderPayload);
    expect(screen.getByText('hook-mounted')).toBeInTheDocument();
  });

  it('replays queued submissions on focus', async () => {
    (createHolyOrder as jest.Mock).mockResolvedValue({ id: 2 });

    render(<HookTester />);

    const itemId = await enqueueOfflineSubmission({ kind: 'holy_order_create', payload: holyOrderPayload });

    act(() => {
      fireEvent.focus(window);
    });

    await expectItemStatus(itemId, 'synced');
    expect(createHolyOrder).toHaveBeenCalledTimes(1);
  });

  it('replays queued submissions on reconnect (online event)', async () => {
    (createHolyOrder as jest.Mock).mockResolvedValue({ id: 3 });

    Object.defineProperty(window.navigator, 'onLine', { configurable: true, value: false });
    render(<HookTester />);

    const itemId = await enqueueOfflineSubmission({ kind: 'holy_order_create', payload: holyOrderPayload });
    const initial = await getOfflineQueueItem(itemId);
    expect(initial?.status).toBe('queued');

    Object.defineProperty(window.navigator, 'onLine', { configurable: true, value: true });

    act(() => {
      window.dispatchEvent(new Event('online'));
    });

    await expectItemStatus(itemId, 'synced');
    expect(createHolyOrder).toHaveBeenCalledTimes(1);
  });

  it('allows manual retry of failed submissions (banner)', async () => {
    (createHolyOrder as jest.Mock).mockResolvedValue({ id: 4 });

    const itemId = await enqueueOfflineSubmission({ kind: 'holy_order_create', payload: holyOrderPayload });
    await updateOfflineQueueItemStatus(itemId, 'failed', { lastError: 'Boom' });

    render(<RetryFailedSubmissionsBanner />);

    const button = await screen.findByRole('button', { name: 'Retry failed submissions' });
    await act(async () => {
      button.click();
    });

    await expectItemStatus(itemId, 'synced');
    expect(createHolyOrder).toHaveBeenCalledTimes(1);
  });
});

