import { apiClient } from '../../../services/apiClient';

export function loginUser(credentials) {
  return apiClient('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

export function registerUser(payload) {
  return apiClient('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function fetchCurrentUser() {
  return apiClient('/api/auth/me');
}
