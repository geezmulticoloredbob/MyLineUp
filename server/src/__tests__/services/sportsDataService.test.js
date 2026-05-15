jest.mock('../../services/nbaService', () => ({ getNBATeamData: jest.fn() }));
jest.mock('../../services/aflService', () => ({ getAFLTeamData: jest.fn() }));
jest.mock('../../services/footballService', () => ({ getEPLTeamData: jest.fn() }));

const { hydrateFavouriteTeams } = require('../../services/sportsDataService');
const { getNBATeamData } = require('../../services/nbaService');
const { getAFLTeamData } = require('../../services/aflService');
const { getEPLTeamData } = require('../../services/footballService');

const liveSportData = {
  logoUrl: 'https://example.com/logo.png',
  latestResult: 'Won 110-98',
  nextFixture: 'vs Boston Celtics',
  ladderPosition: 3,
  stats: { wins: 10, losses: 4 },
};

const nbaFav = { _id: 'f1', teamId: 'nba-lal', teamName: 'Los Angeles Lakers', league: 'NBA', teamLogoUrl: '' };
const aflFav = { _id: 'f2', teamId: 'afl-haw', teamName: 'Hawthorn', league: 'AFL', teamLogoUrl: '' };
const eplFav = { _id: 'f3', teamId: 'epl-mun', teamName: 'Manchester United', league: 'EPL', teamLogoUrl: '' };

describe('sportsDataService', () => {
  describe('hydrateFavouriteTeams', () => {
    it('dispatches to nbaService for NBA favourites', async () => {
      getNBATeamData.mockResolvedValue(liveSportData);
      const [result] = await hydrateFavouriteTeams([nbaFav]);
      expect(getNBATeamData).toHaveBeenCalledWith(nbaFav);
      expect(result.source).toBe('live');
      expect(result.dataAvailable).toBe(true);
    });

    it('dispatches to aflService for AFL favourites', async () => {
      getAFLTeamData.mockResolvedValue(liveSportData);
      const [result] = await hydrateFavouriteTeams([aflFav]);
      expect(getAFLTeamData).toHaveBeenCalledWith(aflFav);
      expect(result.source).toBe('live');
    });

    it('dispatches to footballService for EPL favourites', async () => {
      getEPLTeamData.mockResolvedValue(liveSportData);
      const [result] = await hydrateFavouriteTeams([eplFav]);
      expect(getEPLTeamData).toHaveBeenCalledWith(eplFav);
      expect(result.source).toBe('live');
    });

    it('falls back to unavailable when the sport service throws', async () => {
      getNBATeamData.mockRejectedValue(new Error('API is down'));
      const [result] = await hydrateFavouriteTeams([nbaFav]);
      expect(result.source).toBe('unavailable');
      expect(result.dataAvailable).toBe(false);
      expect(result.latestResult).toBeNull();
      expect(result.nextFixture).toBeNull();
      expect(result.stats).toEqual({});
    });

    it('always includes core favourite fields regardless of API outcome', async () => {
      getNBATeamData.mockRejectedValue(new Error('fail'));
      const [result] = await hydrateFavouriteTeams([nbaFav]);
      expect(result.favouriteId).toBe(nbaFav._id);
      expect(result.teamId).toBe(nbaFav.teamId);
      expect(result.teamName).toBe(nbaFav.teamName);
      expect(result.league).toBe(nbaFav.league);
    });

    it('uses the ESPN CDN logo fallback for NBA when API provides no logo', async () => {
      getNBATeamData.mockResolvedValue({ ...liveSportData, logoUrl: null });
      const [result] = await hydrateFavouriteTeams([{ ...nbaFav, teamLogoUrl: '' }]);
      expect(result.teamLogoUrl).toMatch(/espncdn\.com/);
      expect(result.teamLogoUrl).toMatch(/nba/);
    });

    it('applies ESPN abbreviation overrides for known NBA teams (e.g. gsw → gs)', async () => {
      getNBATeamData.mockResolvedValue({ ...liveSportData, logoUrl: null });
      const gswFav = { ...nbaFav, teamId: 'nba-gsw' };
      const [result] = await hydrateFavouriteTeams([gswFav]);
      expect(result.teamLogoUrl).toContain('/gs.png');
    });

    it('returns source=unavailable for an unknown league without throwing', async () => {
      const unknownFav = { _id: 'fx', teamId: 'other-x', teamName: 'Unknown FC', league: 'UNKNOWN', teamLogoUrl: '' };
      const [result] = await hydrateFavouriteTeams([unknownFav]);
      expect(result.source).toBe('unavailable');
    });

    it('hydrates multiple favourites in parallel and returns them in order', async () => {
      getNBATeamData.mockResolvedValue(liveSportData);
      getAFLTeamData.mockResolvedValue(liveSportData);
      const results = await hydrateFavouriteTeams([nbaFav, aflFav]);
      expect(results).toHaveLength(2);
      expect(results[0].league).toBe('NBA');
      expect(results[1].league).toBe('AFL');
    });
  });
});
