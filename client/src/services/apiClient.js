const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

export async function apiClient(path, options = {}) {
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: 'Request failed' }));
    const err = new Error(body.message || 'Request failed');
    err.status = response.status;
    throw err;
  }

  return response.json();
}
