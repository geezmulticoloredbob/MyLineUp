import { apiClient } from '../../../services/apiClient';

export function fetchFavouriteTeams() {
  return apiClient('/api/favourites');
}

export function saveFavouriteTeam(payload) {
  return apiClient('/api/favourites', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function deleteFavouriteTeam(favouriteId) {
  return apiClient(`/api/favourites/${favouriteId}`, {
    method: 'DELETE',
  });
}
