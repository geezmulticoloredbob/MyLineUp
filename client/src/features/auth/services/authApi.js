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

export function logoutUser() {
  return apiClient('/api/auth/logout', { method: 'POST' });
}

export function updateUserIcon(iconId) {
  return apiClient('/api/auth/icon', {
    method: 'PATCH',
    body: JSON.stringify({ iconId }),
  });
}

export function updateProfile(updates) {
  return apiClient('/api/auth/profile', {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export function updatePassword(payload) {
  return apiClient('/api/auth/password', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}
