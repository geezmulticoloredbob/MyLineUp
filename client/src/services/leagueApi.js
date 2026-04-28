import { apiClient } from './apiClient';

export function fetchFollowedLeagues() {
  return apiClient('/api/leagues');
}

export function updateFollowedLeagues(leagues) {
  return apiClient('/api/leagues', {
    method: 'PUT',
    body: JSON.stringify({ leagues }),
  });
}

export function completeOnboarding() {
  return apiClient('/api/leagues/complete-onboarding', { method: 'POST' });
}
