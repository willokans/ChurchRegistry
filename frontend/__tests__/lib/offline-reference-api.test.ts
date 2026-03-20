jest.mock('@/lib/offline/network', () => ({
  getIsOnline: jest.fn(),
}));

jest.mock('@/lib/offline/referenceCache', () => ({
  loadCachedBaptisms: jest.fn(),
  loadCachedCommunions: jest.fn(),
  loadCachedConfirmations: jest.fn(),
  saveCachedBaptisms: jest.fn(),
  saveCachedCommunions: jest.fn(),
  saveCachedConfirmations: jest.fn(),
}));

describe('offline reference cache integration (api.ts)', () => {
  let fetchBaptisms: typeof import('@/lib/api').fetchBaptisms;
  let fetchCommunions: typeof import('@/lib/api').fetchCommunions;
  let fetchConfirmations: typeof import('@/lib/api').fetchConfirmations;

  let getIsOnlineMock: jest.Mock;
  let loadCachedBaptismsMock: jest.Mock;
  let loadCachedCommunionsMock: jest.Mock;
  let loadCachedConfirmationsMock: jest.Mock;
  let saveCachedBaptismsMock: jest.Mock;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    localStorage.clear();
    // Keep auth header stable in online tests.
    localStorage.setItem('church_registry_token', 'jwt-test');
    localStorage.setItem('church_registry_user', JSON.stringify({ username: 'admin' }));

    global.fetch = jest.fn();

    // Import after mocks are in place (jest.resetModules clears prior module cache).
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const api = require('@/lib/api') as typeof import('@/lib/api');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const network = require('@/lib/offline/network') as { getIsOnline: jest.Mock };
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const referenceCache = require('@/lib/offline/referenceCache') as typeof import('@/lib/offline/referenceCache');

    fetchBaptisms = api.fetchBaptisms;
    fetchCommunions = api.fetchCommunions;
    fetchConfirmations = api.fetchConfirmations;

    getIsOnlineMock = network.getIsOnline;
    loadCachedBaptismsMock = referenceCache.loadCachedBaptisms as unknown as jest.Mock;
    loadCachedCommunionsMock = referenceCache.loadCachedCommunions as unknown as jest.Mock;
    loadCachedConfirmationsMock = referenceCache.loadCachedConfirmations as unknown as jest.Mock;
    saveCachedBaptismsMock = referenceCache.saveCachedBaptisms as unknown as jest.Mock;

    getIsOnlineMock.mockReturnValue(false);
  });

  it('fetchBaptisms: offline returns cached items (page 0) and skips fetch', async () => {
    const parishId = 10;
    const cached = [
      {
        id: 5,
        baptismName: 'Jane',
        otherNames: '',
        surname: 'Doe',
        dateOfBirth: '2016-01-01',
        fathersName: 'Father Doe',
        mothersName: 'Mother Doe',
      },
    ];

    loadCachedBaptismsMock.mockReturnValue(cached);

    const result = await fetchBaptisms(parishId, 0, 50);

    expect(loadCachedBaptismsMock).toHaveBeenCalledWith(parishId, 0);
    expect(global.fetch).not.toHaveBeenCalled();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].id).toBe(5);
  });

  it('fetchCommunions: offline returns cached items (page 0) and skips fetch', async () => {
    const parishId = 11;
    const cached = [
      {
        id: 101,
        baptismId: 1,
        baptismName: 'John',
        otherNames: '',
        surname: 'Doe',
        communionDate: '2000-05-01',
        officiatingPriest: 'Fr. A',
        parish: 'St Mary',
      },
    ];

    loadCachedCommunionsMock.mockReturnValue(cached);

    const result = await fetchCommunions(parishId, 0, 50);

    expect(loadCachedCommunionsMock).toHaveBeenCalledWith(parishId, 0);
    expect(global.fetch).not.toHaveBeenCalled();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].id).toBe(101);
  });

  it('fetchConfirmations: offline returns cached items (page 0) and skips fetch', async () => {
    const parishId = 12;
    const cached = [
      {
        id: 201,
        baptismName: 'Jane',
        otherNames: '',
        surname: 'Doe',
        confirmationDate: '2020-09-01',
        officiatingBishop: 'Bishop A',
      },
    ];

    loadCachedConfirmationsMock.mockReturnValue(cached);

    const result = await fetchConfirmations(parishId, 0, 50);

    expect(loadCachedConfirmationsMock).toHaveBeenCalledWith(parishId, 0);
    expect(global.fetch).not.toHaveBeenCalled();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].id).toBe(201);
  });

  it('fetchBaptisms: online saves mapped cache after successful fetch', async () => {
    getIsOnlineMock.mockReturnValue(true);

    const parishId = 10;
    const page = 0;

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        content: [
          {
            id: 1,
            baptismName: 'John',
            otherNames: 'Paul',
            surname: 'Doe',
            gender: 'MALE',
            dateOfBirth: '2020-01-15',
            fathersName: 'Father',
            mothersName: 'Mother',
            sponsorNames: 'Sponsor',
            officiatingPriest: 'Fr A',
            parishId,
          },
        ],
      }),
    });

    const result = await fetchBaptisms(parishId, page, 50);

    expect(global.fetch).toHaveBeenCalled();
    expect(saveCachedBaptismsMock).toHaveBeenCalledWith(
      parishId,
      page,
      expect.arrayContaining([
        expect.objectContaining({
          id: 1,
          baptismName: 'John',
          otherNames: 'Paul',
          surname: 'Doe',
        }),
      ])
    );
    expect(result.content).toHaveLength(1);
    expect(result.content[0].id).toBe(1);
  });
});

