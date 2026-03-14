/**
 * Tests for ParishContext (ParishProvider, useParish) including diocese support.
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { usePathname } from 'next/navigation';
import { ParishProvider, useParish } from '@/context/ParishContext';
import * as api from '@/lib/api';

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

jest.mock('@/lib/api', () => ({
  fetchDiocesesWithParishes: jest.fn(),
  getStoredToken: jest.fn(),
  getStoredParishId: jest.fn(),
  getStoredDioceseId: jest.fn(),
  setStoredParishId: jest.fn(),
  setStoredDioceseId: jest.fn(),
  clearAuth: jest.fn(),
}));

const mockDioceses = [
  {
    id: 1,
    dioceseName: 'Diocese A',
    parishes: [
      { id: 10, parishName: 'St Mary', dioceseId: 1 },
      { id: 11, parishName: 'St John', dioceseId: 1 },
    ],
  },
  {
    id: 2,
    dioceseName: 'Diocese B',
    parishes: [
      { id: 20, parishName: 'St Peter', dioceseId: 2 },
    ],
  },
];

function Consumer() {
  const { parishId, setParishId, dioceseId, setDioceseId, parishes, dioceses, loading, error, refetch } = useParish();
  return (
    <div>
      <span data-testid="parish-id">{String(parishId)}</span>
      <span data-testid="diocese-id">{String(dioceseId)}</span>
      <span data-testid="parishes-count">{parishes.length}</span>
      <span data-testid="dioceses-count">{dioceses.length}</span>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="error">{error ?? ''}</span>
      <button type="button" onClick={() => setParishId(20)}>Set parish 20</button>
      <button type="button" onClick={() => setDioceseId(1)}>Set diocese 1</button>
      <button type="button" onClick={() => setDioceseId(null)}>Clear diocese</button>
      <button type="button" onClick={refetch}>Refetch</button>
    </div>
  );
}

describe('ParishContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (usePathname as jest.Mock).mockReturnValue('/dashboard');
    (api.getStoredToken as jest.Mock).mockReturnValue('jwt-test');
    (api.getStoredParishId as jest.Mock).mockReturnValue(null);
    (api.getStoredDioceseId as jest.Mock).mockReturnValue(null);
    (api.fetchDiocesesWithParishes as jest.Mock).mockResolvedValue(mockDioceses);
  });

  it('useParish throws when used outside ParishProvider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Consumer />)).toThrow('useParish must be used within ParishProvider');
    spy.mockRestore();
  });

  it('exposes dioceseId, setDioceseId, and dioceses from useParish', async () => {
    render(
      <ParishProvider>
        <Consumer />
      </ParishProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('diocese-id')).toHaveTextContent('null');
      expect(screen.getByTestId('dioceses-count')).toHaveTextContent('2');
    });
  });

  it('fetches dioceses and sets parishes when token exists', async () => {
    render(
      <ParishProvider>
        <Consumer />
      </ParishProvider>
    );

    await waitFor(() => {
      expect(api.fetchDiocesesWithParishes).toHaveBeenCalled();
      expect(screen.getByTestId('parishes-count')).toHaveTextContent('3');
      expect(screen.getByTestId('parish-id')).toHaveTextContent('10');
    });
  });

  it('filters parishes when dioceseId is set', async () => {
    const user = userEvent.setup();
    render(
      <ParishProvider>
        <Consumer />
      </ParishProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('parishes-count')).toHaveTextContent('3');
    });

    await user.click(screen.getByRole('button', { name: 'Set diocese 1' }));

    await waitFor(() => {
      expect(screen.getByTestId('diocese-id')).toHaveTextContent('1');
      expect(screen.getByTestId('parishes-count')).toHaveTextContent('2');
      expect(api.setStoredDioceseId).toHaveBeenCalledWith(1);
    });
  });

  it('shows all parishes when dioceseId is cleared', async () => {
    const user = userEvent.setup();
    (api.getStoredDioceseId as jest.Mock).mockReturnValue(1);

    render(
      <ParishProvider>
        <Consumer />
      </ParishProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('diocese-id')).toHaveTextContent('1');
      expect(screen.getByTestId('parishes-count')).toHaveTextContent('2');
    });

    await user.click(screen.getByRole('button', { name: 'Clear diocese' }));

    await waitFor(() => {
      expect(screen.getByTestId('diocese-id')).toHaveTextContent('null');
      expect(screen.getByTestId('parishes-count')).toHaveTextContent('3');
      expect(api.setStoredDioceseId).toHaveBeenCalledWith(null);
    });
  });

  it('resets parishId when diocese changes and current parish not in new diocese', async () => {
    const user = userEvent.setup();
    render(
      <ParishProvider>
        <Consumer />
      </ParishProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('parish-id')).toHaveTextContent('10');
    });

    await user.click(screen.getByRole('button', { name: 'Set parish 20' }));

    await waitFor(() => {
      expect(screen.getByTestId('parish-id')).toHaveTextContent('20');
    });

    await user.click(screen.getByRole('button', { name: 'Set diocese 1' }));

    await waitFor(() => {
      expect(screen.getByTestId('parish-id')).toHaveTextContent('10');
    });
  });

  it('restores dioceseId from storage on load', async () => {
    (api.getStoredDioceseId as jest.Mock).mockReturnValue(2);

    render(
      <ParishProvider>
        <Consumer />
      </ParishProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('diocese-id')).toHaveTextContent('2');
      expect(screen.getByTestId('parishes-count')).toHaveTextContent('1');
      expect(screen.getByTestId('parish-id')).toHaveTextContent('20');
    });
  });

  it('skips fetch and sets loading false when no token', async () => {
    (api.getStoredToken as jest.Mock).mockReturnValue(null);

    render(
      <ParishProvider>
        <Consumer />
      </ParishProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
      expect(api.fetchDiocesesWithParishes).not.toHaveBeenCalled();
    });
  });

  it('refetch triggers new fetch', async () => {
    const user = userEvent.setup();
    render(
      <ParishProvider>
        <Consumer />
      </ParishProvider>
    );

    await waitFor(() => {
      expect(api.fetchDiocesesWithParishes).toHaveBeenCalledTimes(1);
    });

    await user.click(screen.getByRole('button', { name: 'Refetch' }));

    await waitFor(() => {
      expect(api.fetchDiocesesWithParishes).toHaveBeenCalledTimes(2);
    });
  });

  it('on Unauthorized clears state and sets error', async () => {
    (api.fetchDiocesesWithParishes as jest.Mock).mockRejectedValue(new Error('Unauthorized'));

    render(
      <ParishProvider>
        <Consumer />
      </ParishProvider>
    );

    await waitFor(() => {
      expect(api.clearAuth).toHaveBeenCalled();
      expect(screen.getByTestId('error')).toHaveTextContent('Session expired. Please sign in again.');
    });
  });
});
