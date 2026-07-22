jest.mock('../../services/nbaService', () => ({
  getNBAStandings: jest.fn(),
  getNBALeagueGames: jest.fn(),
}));
jest.mock('../../services/aflService', () => ({
  getAFLStandings: jest.fn(),
  getAFLLeagueGames: jest.fn(),
}));
jest.mock('../../services/footballService', () => ({
  getFDStandingsForOverview: jest.fn(),
  getFDLeagueGames: jest.fn(),
}));
jest.mock('../../services/worldCupService', () => ({
  getWCStandings: jest.fn(),
  getWCLeagueGames: jest.fn(),
}));
jest.mock('../../services/espnTeamSportService', () => ({
  getESPNStandingsOverview: jest.fn(),
  getESPNLeagueGames: jest.fn(),
}));

const { hydrateFollowedLeagues } = require('../../services/leagueService');
const { getNBAStandings, getNBALeagueGames } = require('../../services/nbaService');
const { getAFLStandings, getAFLLeagueGames } = require('../../services/aflService');
const { getFDStandingsForOverview, getFDLeagueGames } = require('../../services/footballService');
const { getWCStandings, getWCLeagueGames } = require('../../services/worldCupService');
const { getESPNStandingsOverview, getESPNLeagueGames } = require('../../services/espnTeamSportService');

const mockStandings = [{ position: 1, teamName: 'Team A' }];
const mockGames = { recentResults: [], upcomingFixtures: [] };

describe('leagueService', () => {
  describe('hydrateFollowedLeagues', () => {
    it('returns an empty array when no leagues are followed', async () => {
      expect(await hydrateFollowedLeagues([])).toEqual([]);
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

    it('dispatches to getFDStandingsForOverview/getFDLeagueGames with PL for EPL', async () => {
      getFDStandingsForOverview.mockResolvedValue(mockStandings);
      getFDLeagueGames.mockResolvedValue(mockGames);
      const [result] = await hydrateFollowedLeagues(['EPL']);
      expect(getFDStandingsForOverview).toHaveBeenCalledWith('PL');
      expect(getFDLeagueGames).toHaveBeenCalledWith('PL');
      expect(result.league).toBe('EPL');
      expect(result.standings).toEqual(mockStandings);
    });

    it('dispatches with PD for LALIGA', async () => {
      getFDStandingsForOverview.mockResolvedValue(mockStandings);
      getFDLeagueGames.mockResolvedValue(mockGames);
      const [result] = await hydrateFollowedLeagues(['LALIGA']);
      expect(getFDStandingsForOverview).toHaveBeenCalledWith('PD');
      expect(getFDLeagueGames).toHaveBeenCalledWith('PD');
      expect(result.league).toBe('LALIGA');
    });

    it('dispatches with BL1 for BUNDESLIGA', async () => {
      getFDStandingsForOverview.mockResolvedValue(mockStandings);
      getFDLeagueGames.mockResolvedValue(mockGames);
      await hydrateFollowedLeagues(['BUNDESLIGA']);
      expect(getFDStandingsForOverview).toHaveBeenCalledWith('BL1');
      expect(getFDLeagueGames).toHaveBeenCalledWith('BL1');
    });

    it('dispatches with SA for SERIEA', async () => {
      getFDStandingsForOverview.mockResolvedValue(mockStandings);
      getFDLeagueGames.mockResolvedValue(mockGames);
      await hydrateFollowedLeagues(['SERIEA']);
      expect(getFDStandingsForOverview).toHaveBeenCalledWith('SA');
      expect(getFDLeagueGames).toHaveBeenCalledWith('SA');
    });

    it('dispatches with FL1 for LIGUE1', async () => {
      getFDStandingsForOverview.mockResolvedValue(mockStandings);
      getFDLeagueGames.mockResolvedValue(mockGames);
      await hydrateFollowedLeagues(['LIGUE1']);
      expect(getFDStandingsForOverview).toHaveBeenCalledWith('FL1');
      expect(getFDLeagueGames).toHaveBeenCalledWith('FL1');
    });

    it('dispatches with ELC for CHAMPIONSHIP', async () => {
      getFDStandingsForOverview.mockResolvedValue(mockStandings);
      getFDLeagueGames.mockResolvedValue(mockGames);
      await hydrateFollowedLeagues(['CHAMPIONSHIP']);
      expect(getFDStandingsForOverview).toHaveBeenCalledWith('ELC');
      expect(getFDLeagueGames).toHaveBeenCalledWith('ELC');
    });

    it('dispatches with DED for EREDIVISIE', async () => {
      getFDStandingsForOverview.mockResolvedValue(mockStandings);
      getFDLeagueGames.mockResolvedValue(mockGames);
      await hydrateFollowedLeagues(['EREDIVISIE']);
      expect(getFDStandingsForOverview).toHaveBeenCalledWith('DED');
      expect(getFDLeagueGames).toHaveBeenCalledWith('DED');
    });

    it('dispatches with CL for UCL', async () => {
      getFDStandingsForOverview.mockResolvedValue(mockStandings);
      getFDLeagueGames.mockResolvedValue(mockGames);
      await hydrateFollowedLeagues(['UCL']);
      expect(getFDStandingsForOverview).toHaveBeenCalledWith('CL');
      expect(getFDLeagueGames).toHaveBeenCalledWith('CL');
    });

    it('dispatches to espnTeamSportService with league NFL for NFL', async () => {
      getESPNStandingsOverview.mockResolvedValue(mockStandings);
      getESPNLeagueGames.mockResolvedValue(mockGames);
      await hydrateFollowedLeagues(['NFL']);
      expect(getESPNStandingsOverview).toHaveBeenCalledWith('NFL');
      expect(getESPNLeagueGames).toHaveBeenCalledWith('NFL');
    });

    it('dispatches to espnTeamSportService with league NHL for NHL', async () => {
      getESPNStandingsOverview.mockResolvedValue(mockStandings);
      getESPNLeagueGames.mockResolvedValue(mockGames);
      await hydrateFollowedLeagues(['NHL']);
      expect(getESPNStandingsOverview).toHaveBeenCalledWith('NHL');
      expect(getESPNLeagueGames).toHaveBeenCalledWith('NHL');
    });

    it('dispatches to espnTeamSportService with league MLB for MLB', async () => {
      getESPNStandingsOverview.mockResolvedValue(mockStandings);
      getESPNLeagueGames.mockResolvedValue(mockGames);
      await hydrateFollowedLeagues(['MLB']);
      expect(getESPNStandingsOverview).toHaveBeenCalledWith('MLB');
      expect(getESPNLeagueGames).toHaveBeenCalledWith('MLB');
    });

    it('dispatches to worldCupService for WC', async () => {
      getWCStandings.mockResolvedValue(mockStandings);
      getWCLeagueGames.mockResolvedValue(mockGames);
      const [result] = await hydrateFollowedLeagues(['WC']);
      expect(getWCStandings).toHaveBeenCalled();
      expect(getWCLeagueGames).toHaveBeenCalled();
      expect(result.league).toBe('WC');
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
