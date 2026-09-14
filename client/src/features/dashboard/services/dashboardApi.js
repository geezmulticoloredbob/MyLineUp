import { apiClient } from '../../../services/apiClient';

export function fetchTeamTrend(league, teamId, options) {
  return apiClient(`/api/dashboard/trend/${league}/${teamId}`, options);
}
