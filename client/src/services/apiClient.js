const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

export async function apiClient(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    if (response.status === 401 && !path.startsWith('/api/auth/')) {
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    const body = await response.json().catch(() => ({ message: 'Request failed' }));
    const err = new Error(body.message || 'Request failed');
    err.status = response.status;
    throw err;
  }

  return response.json();
}
