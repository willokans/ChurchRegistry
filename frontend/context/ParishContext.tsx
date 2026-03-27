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
import { getIsOnline } from '@/lib/offline/network';
import {
  loadCachedDioceseWithParishes,
  loadCachedDioceseWithParishesByParishId,
  saveCachedDioceseWithParishes,
} from '@/lib/offline/referenceCache';

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
        let selectedParishId: number | null = null;
        if (stored !== null && parishesForSelection.some((p) => p.id === stored)) {
          selectedParishId = stored;
          setParishIdState(stored);
        } else if (parishesForSelection.length > 0) {
          const first = parishesForSelection[0].id;
          selectedParishId = first;
          setParishIdState(first);
          setStoredParishId(first);
        } else {
          setParishIdState(null);
        }

        // Persist only the active diocese/parishes for offline reference (small, TTL-capped).
        const activeDioceseForCache =
          validDiocese ??
          (selectedParishId != null ? flatParishes.find((p) => p.id === selectedParishId)?.dioceseId : null);
        if (activeDioceseForCache != null) {
          const dioceseEntry = fetchedDioceses.find((d) => d.id === activeDioceseForCache);
          const dioceseName = dioceseEntry?.dioceseName ?? '';
          const parishesToCache = flatParishes.filter((p) => p.dioceseId === activeDioceseForCache).map((p) => ({
            id: p.id,
            parishName: p.parishName,
            dioceseId: p.dioceseId,
          }));
          saveCachedDioceseWithParishes(activeDioceseForCache, dioceseName, parishesToCache);
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

          // Offline fallback: only load the active parish/diocese cached references.
          if (!getIsOnline()) {
            const storedDiocese = getStoredDioceseId();
            const storedParish = getStoredParishId();

            const cached =
              storedDiocese != null
                ? loadCachedDioceseWithParishes(storedDiocese)
                : null;
            const cachedByParish =
              !cached && storedParish != null ? loadCachedDioceseWithParishesByParishId(storedParish) : null;
            const entry = cached ?? cachedByParish;

            if (entry && entry.parishes.length > 0) {
              const cachedParishes: ParishResponse[] = entry.parishes.map((p) => ({
                id: p.id,
                parishName: p.parishName,
                dioceseId: p.dioceseId,
              }));

              const cachedDioceses: DioceseWithParishesResponse[] = [
                {
                  id: entry.dioceseId,
                  dioceseName: entry.dioceseName,
                  parishes: cachedParishes,
                },
              ];

              setDioceses(cachedDioceses);
              setAllParishes(cachedParishes);
              setDioceseIdState(entry.dioceseId);
              const nextParishId =
                storedParish != null && entry.parishes.some((p) => p.id === storedParish)
                  ? storedParish
                  : entry.parishes[0]?.id ?? null;

              if (nextParishId != null) setStoredParishId(nextParishId);
              setParishIdState(nextParishId);
              // Keep diocese selection consistent for future loads.
              setStoredDioceseId(entry.dioceseId);
              setError(null);
              return;
            }
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
