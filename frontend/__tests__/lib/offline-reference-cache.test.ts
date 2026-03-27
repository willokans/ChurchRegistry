import {
  loadCachedBaptisms,
  loadCachedDioceseWithParishes,
  loadCachedDioceseWithParishesByParishId,
  saveCachedBaptisms,
  saveCachedDioceseWithParishes,
} from '@/lib/offline/referenceCache';

describe('offline referenceCache (minimal, TTL-capped)', () => {
  beforeEach(() => {
    jest.useRealTimers();
    localStorage.clear();
    localStorage.setItem('church_registry_user', JSON.stringify({ username: 'admin' }));
  });

  it('saves and loads cached baptisms (page 0 only)', () => {
    const parishId = 10;
    const items = Array.from({ length: 2 }).map((_, i) => ({
      id: i + 1,
      baptismName: `B${i + 1}`,
      otherNames: '',
      surname: `S${i + 1}`,
      dateOfBirth: '2020-01-01',
      fathersName: '',
      mothersName: '',
      gender: 'MALE',
    }));

    saveCachedBaptisms(parishId, 0, items);
    const loaded = loadCachedBaptisms(parishId, 0);
    expect(loaded).not.toBeNull();
    expect(loaded).toHaveLength(2);
    expect(loaded?.[0].id).toBe(1);
    expect(loaded?.[1].surname).toBe('S2');

    // Should not be cached for other pages.
    saveCachedBaptisms(parishId, 1, items);
    expect(loadCachedBaptisms(parishId, 1)).toBeNull();
  });

  it('enforces list item cap (50)', () => {
    const parishId = 11;
    const items = Array.from({ length: 120 }).map((_, i) => ({
      id: i + 1,
      baptismName: `B${i + 1}`,
      otherNames: '',
      surname: `S${i + 1}`,
      dateOfBirth: '2020-01-01',
      fathersName: '',
      mothersName: '',
    }));

    saveCachedBaptisms(parishId, 0, items);
    const loaded = loadCachedBaptisms(parishId, 0);
    expect(loaded).not.toBeNull();
    expect(loaded?.length).toBeLessThanOrEqual(50);
  });

  it('expires cached diocese references by TTL', () => {
    jest.useFakeTimers();
    const now = new Date('2026-01-01T00:00:00.000Z');
    jest.setSystemTime(now);

    const dioceseId = 1;
    saveCachedDioceseWithParishes(
      dioceseId,
      'Diocese A',
      [
        { id: 10, parishName: 'St Mary', dioceseId },
        { id: 11, parishName: 'St John', dioceseId },
      ],
      { ttlMs: 1000 }
    );

    expect(loadCachedDioceseWithParishes(dioceseId)).not.toBeNull();

    // Advance beyond TTL.
    jest.setSystemTime(new Date(now.getTime() + 2000));
    expect(loadCachedDioceseWithParishes(dioceseId)).toBeNull();
    expect(loadCachedDioceseWithParishesByParishId(10)).toBeNull();
  });

  it('keeps diocese cache scoped and discoverable by parishId', () => {
    const dioceseId = 2;
    saveCachedDioceseWithParishes(dioceseId, 'Diocese B', [
      { id: 20, parishName: 'St Peter', dioceseId },
      { id: 21, parishName: 'St Paul', dioceseId },
    ]);

    const byId = loadCachedDioceseWithParishes(dioceseId);
    expect(byId).not.toBeNull();
    expect(byId?.parishes).toHaveLength(2);

    const byParish = loadCachedDioceseWithParishesByParishId(21);
    expect(byParish?.dioceseId).toBe(dioceseId);
  });
});

