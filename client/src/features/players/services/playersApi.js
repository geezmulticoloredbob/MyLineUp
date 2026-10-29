import { apiClient } from '../../../services/apiClient';

export function fetchRoster(league, teamId, teamName = '') {
  const query = teamName ? `?teamName=${encodeURIComponent(teamName)}` : '';
  return apiClient(`/api/players/roster/${league}/${teamId}${query}`);
}

export function fetchPlayerFavourites() {
  return apiClient('/api/players/favourites');
}

export function savePlayerFavourite(payload) {
  return apiClient('/api/players/favourites', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function deletePlayerFavourite(favouriteId) {
  return apiClient(`/api/players/favourites/${favouriteId}`, {
    method: 'DELETE',
  });
}
