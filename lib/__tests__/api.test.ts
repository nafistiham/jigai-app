import { fetchHealth, fetchEvents, fetchSessions } from '../api';

const BASE = 'http://192.168.1.5:9384';

beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('fetchHealth', () => {
  it('returns health data on success', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok', version: '0.1.0', clients: 1, sessions: 2 }),
    });

    const result = await fetchHealth(BASE);
    expect(result).toEqual({ status: 'ok', version: '0.1.0', clients: 1, sessions: 2 });
    expect(fetch).toHaveBeenCalledWith(`${BASE}/api/health`);
  });

  it('returns null on network error', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
    const result = await fetchHealth(BASE);
    expect(result).toBeNull();
  });
});

describe('fetchEvents', () => {
  it('returns events array', async () => {
    const events = [{ session_id: 'abc', tool_name: 'Claude Code' }];
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ events }),
    });

    const result = await fetchEvents(BASE, 20);
    expect(result).toEqual(events);
    expect(fetch).toHaveBeenCalledWith(`${BASE}/api/events?limit=20`);
  });

  it('returns empty array on error', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('timeout'));
    const result = await fetchEvents(BASE, 20);
    expect(result).toEqual([]);
  });
});

describe('fetchSessions', () => {
  it('returns sessions array', async () => {
    const sessions = [{ session_id: 'abc', tool_name: 'Claude Code', status: 'idle' }];
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ sessions }),
    });

    const result = await fetchSessions(BASE);
    expect(result).toEqual(sessions);
  });
});
