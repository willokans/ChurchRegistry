'use client';

import { useEffect, useState } from 'react';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { useParish } from '@/context/ParishContext';
import {
  fetchDioceses,
  fetchParishes,
  createDiocese,
  createParish,
  type DioceseResponse,
  type ParishResponse,
} from '@/lib/api';

export default function ParishesPage() {
  const { refetch } = useParish();
  const [dioceses, setDioceses] = useState<DioceseResponse[]>([]);
  const [parishesByDiocese, setParishesByDiocese] = useState<Record<number, ParishResponse[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newDioceseName, setNewDioceseName] = useState('');
  const [addingDiocese, setAddingDiocese] = useState(false);
  const [newParishByDiocese, setNewParishByDiocese] = useState<Record<number, string>>({});
  const [addingParishFor, setAddingParishFor] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const list = await fetchDioceses();
        if (cancelled) return;
        setDioceses(list);
        const byDiocese: Record<number, ParishResponse[]> = {};
        for (const d of list) {
          const parishes = await fetchParishes(d.id);
          if (cancelled) return;
          byDiocese[d.id] = parishes;
        }
        setParishesByDiocese(byDiocese);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  async function handleAddDiocese(e: React.FormEvent) {
    e.preventDefault();
    const name = newDioceseName.trim();
    if (!name) return;
    setAddingDiocese(true);
    setError(null);
    try {
      await createDiocese(name);
      setNewDioceseName('');
      const list = await fetchDioceses();
      setDioceses(list);
      const byDiocese = { ...parishesByDiocese };
      const newDiocese = list.find((d) => d.name === name);
      if (newDiocese) byDiocese[newDiocese.id] = [];
      setParishesByDiocese(byDiocese);
      refetch();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add diocese');
    } finally {
      setAddingDiocese(false);
    }
  }

  async function handleAddParish(e: React.FormEvent, dioceseId: number) {
    e.preventDefault();
    const parishName = (newParishByDiocese[dioceseId] ?? '').trim();
    if (!parishName) return;
    setAddingParishFor(dioceseId);
    setError(null);
    try {
      await createParish(dioceseId, parishName);
      setNewParishByDiocese((prev) => ({ ...prev, [dioceseId]: '' }));
      const parishes = await fetchParishes(dioceseId);
      setParishesByDiocese((prev) => ({ ...prev, [dioceseId]: parishes }));
      refetch();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add parish');
    } finally {
      setAddingParishFor(null);
    }
  }

  if (loading) {
    return (
      <AuthenticatedLayout>
        <p className="text-gray-600">Loading…</p>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <h1 className="text-2xl font-serif font-semibold text-sancta-maroon">
        Dioceses & Parishes
      </h1>
      <p className="mt-2 text-gray-600">
        Add a diocese, then add parishes to it. Select a parish in the sidebar to record sacraments.
      </p>

      {error && (
        <p role="alert" className="mt-4 text-red-600">
          {error}
        </p>
      )}

      <form onSubmit={handleAddDiocese} className="mt-6 flex flex-wrap items-end gap-3">
        <label htmlFor="new-diocese-name" className="sr-only">
          Diocese name
        </label>
        <input
          id="new-diocese-name"
          type="text"
          value={newDioceseName}
          onChange={(e) => setNewDioceseName(e.target.value)}
          placeholder="Diocese name"
          className="rounded-lg border border-gray-200 px-3 py-2 text-gray-900 focus:border-sancta-maroon focus:outline-none focus:ring-1 focus:ring-sancta-maroon min-w-[200px]"
          disabled={addingDiocese}
        />
        <button
          type="submit"
          disabled={addingDiocese || !newDioceseName.trim()}
          className="rounded-lg bg-sancta-maroon px-4 py-2 text-white font-medium hover:bg-sancta-maroon-dark disabled:opacity-50"
        >
          {addingDiocese ? 'Adding…' : 'Add diocese'}
        </button>
      </form>

      <div className="mt-8 space-y-8">
        {dioceses.length === 0 ? (
          <p className="text-gray-600">No dioceses yet. Add one above.</p>
        ) : (
          dioceses.map((diocese) => (
            <section
              key={diocese.id}
              className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
            >
              <h2 className="text-lg font-semibold text-sancta-maroon">{diocese.name}</h2>
              <ul className="mt-3 space-y-1" role="list">
                {(parishesByDiocese[diocese.id] ?? []).map((p) => (
                  <li key={p.id} className="text-gray-700">
                    {p.parishName}
                  </li>
                ))}
              </ul>
              <form
                onSubmit={(e) => handleAddParish(e, diocese.id)}
                className="mt-4 flex flex-wrap items-end gap-3"
              >
                <label htmlFor={`new-parish-${diocese.id}`} className="sr-only">
                  Parish name
                </label>
                <input
                  id={`new-parish-${diocese.id}`}
                  type="text"
                  value={newParishByDiocese[diocese.id] ?? ''}
                  onChange={(e) =>
                    setNewParishByDiocese((prev) => ({ ...prev, [diocese.id]: e.target.value }))
                  }
                  placeholder="Parish name"
                  className="rounded-lg border border-gray-200 px-3 py-2 text-gray-900 focus:border-sancta-maroon focus:outline-none focus:ring-1 focus:ring-sancta-maroon min-w-[180px]"
                  disabled={addingParishFor === diocese.id}
                />
                <button
                  type="submit"
                  disabled={addingParishFor === diocese.id || !(newParishByDiocese[diocese.id] ?? '').trim()}
                  className="rounded-lg bg-sancta-maroon px-4 py-2 text-white font-medium hover:bg-sancta-maroon-dark disabled:opacity-50 text-sm"
                >
                  {addingParishFor === diocese.id ? 'Adding…' : 'Add parish'}
                </button>
              </form>
            </section>
          ))
        )}
      </div>
    </AuthenticatedLayout>
  );
}
