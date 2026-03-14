/**
 * Tests for API functions.
 */
import {
  fetchDioceseDashboard,
  getStoredDioceseId,
  setStoredDioceseId,
  type DioceseDashboardResponse,
} from '@/lib/api';

const mockDioceseDashboard: DioceseDashboardResponse = {
  counts: {
    parishes: 3,
    baptisms: 150,
    communions: 80,
    confirmations: 45,
    marriages: 22,
    holyOrders: 2,
  },
  parishActivity: [
    { parishId: 1, parishName: 'St Mary', baptisms: 60, communions: 30, confirmations: 15, marriages: 8 },
    { parishId: 2, parishName: 'St Joseph', baptisms: 50, communions: 25, confirmations: 18, marriages: 7 },
    { parishId: 3, parishName: 'St Peter', baptisms: 40, communions: 25, confirmations: 12, marriages: 7 },
  ],
  recentSacraments: {
    baptisms: [
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
        parishId: 1,
      },
    ],
    communions: [],
    confirmations: [],
    marriages: [],
  },
  monthly: {
    baptisms: [5, 3, 8, 4, 6, 2, 1, 3, 4, 5, 6, 7],
    communions: [2, 1, 3, 2, 4, 1, 0, 2, 3, 2, 1, 2],
    confirmations: [1, 0, 2, 1, 1, 0, 0, 1, 1, 0, 1, 1],
    marriages: [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
  },
};

describe('fetchDioceseDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('church_registry_token', 'jwt-test');
  });

  it('calls GET /api/dioceses/{dioceseId}/dashboard with auth header', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockDioceseDashboard),
    });
    global.fetch = mockFetch;

    const result = await fetchDioceseDashboard(5);

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8080/api/dioceses/5/dashboard',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer jwt-test',
          'Content-Type': 'application/json',
        }),
      })
    );
    expect(result).toEqual(mockDioceseDashboard);
  });

  it('returns DioceseDashboardResponse with counts, parishActivity, recentSacraments, monthly', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockDioceseDashboard),
    });

    const result = await fetchDioceseDashboard(1);

    expect(result.counts).toEqual({
      parishes: 3,
      baptisms: 150,
      communions: 80,
      confirmations: 45,
      marriages: 22,
      holyOrders: 2,
    });
    expect(result.parishActivity).toHaveLength(3);
    expect(result.parishActivity[0]).toEqual({
      parishId: 1,
      parishName: 'St Mary',
      baptisms: 60,
      communions: 30,
      confirmations: 15,
      marriages: 8,
    });
    expect(result.recentSacraments.baptisms).toHaveLength(1);
    expect(result.recentSacraments.baptisms[0].baptismName).toBe('John');
    expect(result.monthly.baptisms).toHaveLength(12);
  });

  it('throws on 401 Unauthorized', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 401 });

    await expect(fetchDioceseDashboard(1)).rejects.toThrow('Unauthorized');
  });

  it('throws on non-ok response', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 403 });

    await expect(fetchDioceseDashboard(1)).rejects.toThrow('Failed to fetch diocese dashboard');
  });
});

describe('getStoredDioceseId / setStoredDioceseId', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns null when no diocese stored', () => {
    expect(getStoredDioceseId()).toBeNull();
  });

  it('returns stored diocese id', () => {
    setStoredDioceseId(5);
    expect(getStoredDioceseId()).toBe(5);
  });

  it('clears diocese when set to null', () => {
    setStoredDioceseId(3);
    setStoredDioceseId(null);
    expect(getStoredDioceseId()).toBeNull();
  });

  it('returns null for invalid stored value', () => {
    localStorage.setItem('church_registry_diocese_id', 'invalid');
    expect(getStoredDioceseId()).toBeNull();
  });
});
