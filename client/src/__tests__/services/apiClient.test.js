import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '../../services/apiClient';

// Mirrors the fallback in apiClient.js itself — there's no .env loaded under vitest.
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

function mockFetchOnce(response) {
  global.fetch = vi.fn().mockResolvedValue(response);
}

function jsonResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

describe('apiClient', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('requests the full URL with credentials included and a JSON content-type header', async () => {
    mockFetchOnce(jsonResponse(200, { ok: true }));

    await apiClient('/api/dashboard');

    expect(global.fetch).toHaveBeenCalledWith(
      `${API_URL}/api/dashboard`,
      expect.objectContaining({
        credentials: 'include',
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      })
    );
  });

  it('merges caller-supplied options and headers rather than replacing them', async () => {
    mockFetchOnce(jsonResponse(200, {}));

    await apiClient('/api/favourites', {
      method: 'POST',
      headers: { 'X-Custom': 'yes' },
      body: JSON.stringify({ league: 'NBA' }),
    });

    const [, options] = global.fetch.mock.calls[0];
    expect(options.method).toBe('POST');
    expect(options.body).toBe(JSON.stringify({ league: 'NBA' }));
    expect(options.headers).toEqual(
      expect.objectContaining({ 'Content-Type': 'application/json', 'X-Custom': 'yes' })
    );
  });

  it('resolves with the parsed JSON body on success', async () => {
    mockFetchOnce(jsonResponse(200, { teams: [1, 2, 3] }));
    const result = await apiClient('/api/dashboard');
    expect(result).toEqual({ teams: [1, 2, 3] });
  });

  it('throws an Error carrying the response status and server message on failure', async () => {
    mockFetchOnce(jsonResponse(400, { message: 'Bad request' }));
    await expect(apiClient('/api/favourites')).rejects.toMatchObject({
      message: 'Bad request',
      status: 400,
    });
  });

  it('falls back to a generic message when the error body is not valid JSON', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => { throw new Error('not json'); },
    });
    await expect(apiClient('/api/dashboard')).rejects.toMatchObject({
      message: 'Request failed',
      status: 500,
    });
  });

  it('dispatches auth:unauthorized on a 401 from a non-auth endpoint', async () => {
    mockFetchOnce(jsonResponse(401, { message: 'Unauthorized' }));
    const listener = vi.fn();
    window.addEventListener('auth:unauthorized', listener);

    await expect(apiClient('/api/dashboard')).rejects.toThrow();

    expect(listener).toHaveBeenCalledTimes(1);
    window.removeEventListener('auth:unauthorized', listener);
  });

  it('does not dispatch auth:unauthorized on a 401 from an auth endpoint', async () => {
    mockFetchOnce(jsonResponse(401, { message: 'Invalid credentials' }));
    const listener = vi.fn();
    window.addEventListener('auth:unauthorized', listener);

    await expect(apiClient('/api/auth/login')).rejects.toThrow();

    expect(listener).not.toHaveBeenCalled();
    window.removeEventListener('auth:unauthorized', listener);
  });
});
