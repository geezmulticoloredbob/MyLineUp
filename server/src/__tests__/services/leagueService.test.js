jest.mock('../../services/nbaService', () => ({
  getNBAStandings: jest.fn(),
  getNBALeagueGames: jest.fn(),
}));
jest.mock('../../services/aflService', () => ({
  getAFLStandings: jest.fn(),
  getAFLLeagueGames: jest.fn(),
}));
jest.mock('../../services/footballService', () => ({
  getEPLStandings: jest.fn(),
  getEPLLeagueGames: jest.fn(),
}));

const { hydrateFollowedLeagues } = require('../../services/leagueService');
const { getNBAStandings, getNBALeagueGames } = require('../../services/nbaService');
const { getAFLStandings, getAFLLeagueGames } = require('../../services/aflService');
const { getEPLStandings, getEPLLeagueGames } = require('../../services/footballService');

const mockStandings = [{ position: 1, teamName: 'Team A' }];
const mockGames = { recentResults: [], upcomingFixtures: [] };

describe('leagueService', () => {
  describe('hydrateFollowedLeagues', () => {
    it('returns an empty array when no leagues are followed', async () => {
      const result = await hydrateFollowedLeagues([]);
      expect(result).toEqual([]);
    });

    it('returns empty array for null/undefined input', async () => {
      expect(await hydrateFollowedLeagues(null)).toEqual([]);
      expect(await hydrateFollowedLeagues(undefined)).toEqual([]);
    });

    it('dispatches to nbaService for NBA', async () => {
      getNBAStandings.mockResolvedValue(mockStandings);
      getNBALeagueGames.mockResolvedValue(mockGames);
      const [result] = await hydrateFollowedLeagues(['NBA']);
      expect(result.league).toBe('NBA');
      expect(result.standings).toEqual(mockStandings);
    });

    it('dispatches to aflService for AFL', async () => {
      getAFLStandings.mockResolvedValue(mockStandings);
      getAFLLeagueGames.mockResolvedValue(mockGames);
      const [result] = await hydrateFollowedLeagues(['AFL']);
      expect(result.league).toBe('AFL');
      expect(result.standings).toEqual(mockStandings);
    });

    it('dispatches to footballService for EPL', async () => {
      getEPLStandings.mockResolvedValue(mockStandings);
      getEPLLeagueGames.mockResolvedValue(mockGames);
      const [result] = await hydrateFollowedLeagues(['EPL']);
      expect(result.league).toBe('EPL');
      expect(result.standings).toEqual(mockStandings);
    });

    it('falls back to null standings and empty games when a service throws', async () => {
      getNBAStandings.mockRejectedValue(new Error('API down'));
      getNBALeagueGames.mockRejectedValue(new Error('API down'));
      const [result] = await hydrateFollowedLeagues(['NBA']);
      expect(result.league).toBe('NBA');
      expect(result.standings).toBeNull();
      expect(result.recentResults).toEqual([]);
      expect(result.upcomingFixtures).toEqual([]);
    });

    it('returns a fallback entry for an unknown league without throwing', async () => {
      const [result] = await hydrateFollowedLeagues(['UNKNOWN']);
      expect(result.league).toBe('UNKNOWN');
      expect(result.standings).toBeNull();
    });

    it('hydrates multiple leagues in parallel', async () => {
      getNBAStandings.mockResolvedValue(mockStandings);
      getNBALeagueGames.mockResolvedValue(mockGames);
      getAFLStandings.mockResolvedValue(mockStandings);
      getAFLLeagueGames.mockResolvedValue(mockGames);
      const results = await hydrateFollowedLeagues(['NBA', 'AFL']);
      expect(results).toHaveLength(2);
      expect(results[0].league).toBe('NBA');
      expect(results[1].league).toBe('AFL');
    });
  });
});
