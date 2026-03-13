'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  clearAuth,
  fetchDiocesesWithParishes,
  getStoredDioceseId,
  getStoredParishId,
  getStoredToken,
  setStoredDioceseId,
  setStoredParishId,
  type DioceseWithParishesResponse,
  type ParishResponse,
} from '@/lib/api';

type ParishContextValue = {
  parishId: number | null;
  setParishId: (id: number | null) => void;
  dioceseId: number | null;
  setDioceseId: (id: number | null) => void;
  parishes: ParishResponse[];
  dioceses: DioceseWithParishesResponse[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
};

const ParishContext = createContext<ParishContextValue | null>(null);

export function ParishProvider({ children }: { children: React.ReactNode }) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [parishId, setParishIdState] = useState<number | null>(null);
  const [dioceseId, setDioceseIdState] = useState<number | null>(null);
  const [dioceses, setDioceses] = useState<DioceseWithParishesResponse[]>([]);
  const [allParishes, setAllParishes] = useState<ParishResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const parishes = dioceseId != null
    ? allParishes.filter((p) => p.dioceseId === dioceseId)
    : allParishes;

  const refetch = useCallback(() => {
    setRefreshTrigger((t) => t + 1);
  }, []);

  const setParishId = useCallback((id: number | null) => {
    setParishIdState(id);
    setStoredParishId(id);
  }, []);

  const setDioceseId = useCallback((id: number | null) => {
    setDioceseIdState(id);
    setStoredDioceseId(id);
  }, []);

  useEffect(() => {
    if (!getStoredToken()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    let cancelled = false;
    const timeoutId = window.setTimeout(() => {
      if (!cancelled) {
        setLoading(false);
        setError('Request timed out. Check the console and ensure the dev server is running.');
      }
    }, 15000);
    (async () => {
      try {
        const fetchedDioceses = await fetchDiocesesWithParishes();
        if (cancelled) return;
        const flatParishes: ParishResponse[] = fetchedDioceses.flatMap((d) => d.parishes ?? []);
        setDioceses(fetchedDioceses);
        setAllParishes(flatParishes);

        const storedDiocese = getStoredDioceseId();
        const validDiocese =
          storedDiocese != null && fetchedDioceses.some((d) => d.id === storedDiocese)
            ? storedDiocese
            : null;
        setDioceseIdState(validDiocese);
        if (validDiocese != null) setStoredDioceseId(validDiocese);

        const parishesForSelection = validDiocese != null
          ? flatParishes.filter((p) => p.dioceseId === validDiocese)
          : flatParishes;
        const stored = getStoredParishId();
        if (stored !== null && parishesForSelection.some((p) => p.id === stored)) {
          setParishIdState(stored);
        } else if (parishesForSelection.length > 0) {
          const first = parishesForSelection[0].id;
          setParishIdState(first);
          setStoredParishId(first);
        } else {
          setParishIdState(null);
        }
      } catch (e) {
        if (!cancelled) {
          const message = e instanceof Error ? e.message : 'Failed to load parishes';
          if (message === 'Unauthorized') {
            clearAuth();
            setDioceses([]);
            setAllParishes([]);
            setParishIdState(null);
            setDioceseIdState(null);
            setError('Session expired. Please sign in again.');
            return;
          }
          setError(message);
        }
      } finally {
        if (!cancelled) {
          window.clearTimeout(timeoutId);
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [refreshTrigger]);

  useEffect(() => {
    if (parishId == null || parishes.length === 0) return;
    const currentInList = parishes.some((p) => p.id === parishId);
    if (!currentInList) {
      const first = parishes[0].id;
      setParishIdState(first);
      setStoredParishId(first);
    }
  }, [dioceseId, parishId, parishes]);

  const value: ParishContextValue = {
    parishId,
    setParishId,
    dioceseId,
    setDioceseId,
    parishes,
    dioceses,
    loading,
    error,
    refetch,
  };

  return (
    <ParishContext.Provider value={value}>
      {children}
    </ParishContext.Provider>
  );
}

export function useParish(): ParishContextValue {
  const ctx = useContext(ParishContext);
  if (!ctx) {
    throw new Error('useParish must be used within ParishProvider');
  }
  return ctx;
}
