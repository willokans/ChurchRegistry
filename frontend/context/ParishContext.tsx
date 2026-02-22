'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  fetchDioceses,
  fetchParishes,
  getStoredParishId,
  getStoredToken,
  setStoredParishId,
  type ParishResponse,
} from '@/lib/api';

type ParishContextValue = {
  parishId: number | null;
  setParishId: (id: number | null) => void;
  parishes: ParishResponse[];
  loading: boolean;
  error: string | null;
};

const ParishContext = createContext<ParishContextValue | null>(null);

export function ParishProvider({ children }: { children: React.ReactNode }) {
  const [parishId, setParishIdState] = useState<number | null>(null);
  const [parishes, setParishes] = useState<ParishResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const setParishId = useCallback((id: number | null) => {
    setParishIdState(id);
    setStoredParishId(id);
  }, []);

  useEffect(() => {
    if (!getStoredToken()) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const dioceses = await fetchDioceses();
        if (cancelled) return;
        if (dioceses.length === 0) {
          setParishes([]);
          setLoading(false);
          return;
        }
        const allParishes: ParishResponse[] = [];
        for (const diocese of dioceses) {
          const list = await fetchParishes(diocese.id);
          if (cancelled) return;
          allParishes.push(...list);
        }
        setParishes(allParishes);
        const stored = getStoredParishId();
        if (stored !== null && allParishes.some((p) => p.id === stored)) {
          setParishIdState(stored);
        } else if (allParishes.length > 0) {
          const first = allParishes[0].id;
          setParishIdState(first);
          setStoredParishId(first);
        } else {
          setParishIdState(null);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load parishes');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const value: ParishContextValue = {
    parishId,
    setParishId,
    parishes,
    loading,
    error,
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
