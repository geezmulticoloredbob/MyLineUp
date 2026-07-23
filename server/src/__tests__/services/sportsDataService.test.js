jest.mock('../../services/nbaService', () => ({ getNBATeamData: jest.fn() }));
jest.mock('../../services/aflService', () => ({ getAFLTeamData: jest.fn() }));
jest.mock('../../services/footballService', () => ({ getFDTeamData: jest.fn() }));
jest.mock('../../services/worldCupService', () => ({ getWCTeamData: jest.fn() }));
jest.mock('../../services/espnTeamSportService', () => ({ getESPNTeamData: jest.fn() }));

const { hydrateFavouriteTeams } = require('../../services/sportsDataService');
const { getNBATeamData } = require('../../services/nbaService');
const { getAFLTeamData } = require('../../services/aflService');
const { getFDTeamData } = require('../../services/footballService');
const { getWCTeamData } = require('../../services/worldCupService');
const { getESPNTeamData } = require('../../services/espnTeamSportService');

const liveSportData = {
  logoUrl: 'https://example.com/logo.png',
  latestResult: { outcome: 'W', score: '2-1', opponent: 'Test FC', date: '2026-06-01' },
  nextFixture: { opponent: 'Boston Celtics', date: '2026-07-01', venue: 'Home' },
  ladderPosition: 3,
  stats: { wins: 10, losses: 4 },
  topScorers: [],
  seasonFinished: false,
};

const nbaFav      = { _id: 'f1', teamId: 'nba-lal',  teamName: 'Los Angeles Lakers',  league: 'NBA',        teamLogoUrl: '' };
const aflFav      = { _id: 'f2', teamId: 'afl-haw',  teamName: 'Hawthorn',            league: 'AFL',        teamLogoUrl: '' };
const eplFav      = { _id: 'f3', teamId: 'epl-mun',  teamName: 'Manchester United',   league: 'EPL',        teamLogoUrl: '' };
const wcFav       = { _id: 'f4', teamId: 'wc-eng',   teamName: 'England',             league: 'WC',         teamLogoUrl: '' };
const laligaFav   = { _id: 'f5', teamId: 'lla-rma',  teamName: 'Real Madrid',         league: 'LALIGA',     teamLogoUrl: '' };
const bundesFav   = { _id: 'f6', teamId: 'bun-bay',  teamName: 'Bayern Munich',       league: 'BUNDESLIGA', teamLogoUrl: '' };
const serieaFav   = { _id: 'f7', teamId: 'ser-juv',  teamName: 'Juventus',            league: 'SERIEA',     teamLogoUrl: '' };
const ligue1Fav   = { _id: 'f8', teamId: 'l1-psg',   teamName: 'Paris Saint-Germain', league: 'LIGUE1',     teamLogoUrl: '' };
const champFav    = { _id: 'f9', teamId: 'cha-lei',  teamName: 'Leicester City',      league: 'CHAMPIONSHIP', teamLogoUrl: '' };
const eredivFav   = { _id: 'f10', teamId: 'ere-ajx', teamName: 'Ajax',                league: 'EREDIVISIE', teamLogoUrl: '' };
const uclFav      = { _id: 'f11', teamId: 'ucl-rma', teamName: 'Real Madrid',         league: 'UCL',        teamLogoUrl: '' };
const nflFav      = { _id: 'f12', teamId: 'nfl-kc',  teamName: 'Kansas City Chiefs',  league: 'NFL',        teamLogoUrl: '' };
const nhlFav      = { _id: 'f13', teamId: 'nhl-bos',  teamName: 'Boston Bruins',      league: 'NHL',        teamLogoUrl: '' };
const mlbFav      = { _id: 'f14', teamId: 'mlb-nyy',  teamName: 'New York Yankees',   league: 'MLB',        teamLogoUrl: '' };

describe('sportsDataService', () => {
  describe('hydrateFavouriteTeams — routing', () => {
    it('dispatches to nbaService for NBA', async () => {
      getNBATeamData.mockResolvedValue(liveSportData);
      const [result] = await hydrateFavouriteTeams([nbaFav]);
      expect(getNBATeamData).toHaveBeenCalledWith(nbaFav);
      expect(result.source).toBe('live');
    });

    it('dispatches to aflService for AFL', async () => {
      getAFLTeamData.mockResolvedValue(liveSportData);
      const [result] = await hydrateFavouriteTeams([aflFav]);
      expect(getAFLTeamData).toHaveBeenCalledWith(aflFav);
      expect(result.source).toBe('live');
    });

    it('dispatches to getFDTeamData with code PL for EPL', async () => {
      getFDTeamData.mockResolvedValue(liveSportData);
      const [result] = await hydrateFavouriteTeams([eplFav]);
      expect(getFDTeamData).toHaveBeenCalledWith(eplFav, 'PL');
      expect(result.source).toBe('live');
    });

    it('dispatches to getWCTeamData for WC', async () => {
      getWCTeamData.mockResolvedValue(liveSportData);
      const [result] = await hydrateFavouriteTeams([wcFav]);
      expect(getWCTeamData).toHaveBeenCalledWith(wcFav);
      expect(result.source).toBe('live');
    });

    it('dispatches to getFDTeamData with code PD for LALIGA', async () => {
      getFDTeamData.mockResolvedValue(liveSportData);
      const [result] = await hydrateFavouriteTeams([laligaFav]);
      expect(getFDTeamData).toHaveBeenCalledWith(laligaFav, 'PD');
      expect(result.source).toBe('live');
    });

    it('dispatches to getFDTeamData with code BL1 for BUNDESLIGA', async () => {
      getFDTeamData.mockResolvedValue(liveSportData);
      const [result] = await hydrateFavouriteTeams([bundesFav]);
      expect(getFDTeamData).toHaveBeenCalledWith(bundesFav, 'BL1');
      expect(result.source).toBe('live');
    });

    it('dispatches to getFDTeamData with code SA for SERIEA', async () => {
      getFDTeamData.mockResolvedValue(liveSportData);
      const [result] = await hydrateFavouriteTeams([serieaFav]);
      expect(getFDTeamData).toHaveBeenCalledWith(serieaFav, 'SA');
      expect(result.source).toBe('live');
    });

    it('dispatches to getFDTeamData with code FL1 for LIGUE1', async () => {
      getFDTeamData.mockResolvedValue(liveSportData);
      const [result] = await hydrateFavouriteTeams([ligue1Fav]);
      expect(getFDTeamData).toHaveBeenCalledWith(ligue1Fav, 'FL1');
      expect(result.source).toBe('live');
    });

    it('dispatches to getFDTeamData with code ELC for CHAMPIONSHIP', async () => {
      getFDTeamData.mockResolvedValue(liveSportData);
      const [result] = await hydrateFavouriteTeams([champFav]);
      expect(getFDTeamData).toHaveBeenCalledWith(champFav, 'ELC');
      expect(result.source).toBe('live');
    });

    it('dispatches to getFDTeamData with code DED for EREDIVISIE', async () => {
      getFDTeamData.mockResolvedValue(liveSportData);
      const [result] = await hydrateFavouriteTeams([eredivFav]);
      expect(getFDTeamData).toHaveBeenCalledWith(eredivFav, 'DED');
      expect(result.source).toBe('live');
    });

    it('dispatches to getFDTeamData with code CL for UCL', async () => {
      getFDTeamData.mockResolvedValue(liveSportData);
      const [result] = await hydrateFavouriteTeams([uclFav]);
      expect(getFDTeamData).toHaveBeenCalledWith(uclFav, 'CL');
      expect(result.source).toBe('live');
    });

    it('dispatches to getESPNTeamData with league NFL for NFL', async () => {
      getESPNTeamData.mockResolvedValue(liveSportData);
      const [result] = await hydrateFavouriteTeams([nflFav]);
      expect(getESPNTeamData).toHaveBeenCalledWith(nflFav, 'NFL');
      expect(result.source).toBe('live');
    });

    it('dispatches to getESPNTeamData with league NHL for NHL', async () => {
      getESPNTeamData.mockResolvedValue(liveSportData);
      const [result] = await hydrateFavouriteTeams([nhlFav]);
      expect(getESPNTeamData).toHaveBeenCalledWith(nhlFav, 'NHL');
      expect(result.source).toBe('live');
    });

    it('dispatches to getESPNTeamData with league MLB for MLB', async () => {
      getESPNTeamData.mockResolvedValue(liveSportData);
      const [result] = await hydrateFavouriteTeams([mlbFav]);
      expect(getESPNTeamData).toHaveBeenCalledWith(mlbFav, 'MLB');
      expect(result.source).toBe('live');
    });

    it('returns source=unavailable for an unknown league without throwing', async () => {
      const unknownFav = { _id: 'fx', teamId: 'other-x', teamName: 'Unknown FC', league: 'UNKNOWN', teamLogoUrl: '' };
      const [result] = await hydrateFavouriteTeams([unknownFav]);
      expect(result.source).toBe('unavailable');
    });
  });

  describe('hydrateFavouriteTeams — fallback behaviour', () => {
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

    it('passes seasonFinished through from sport data', async () => {
      getFDTeamData.mockResolvedValue({ ...liveSportData, seasonFinished: true });
      const [result] = await hydrateFavouriteTeams([eplFav]);
      expect(result.seasonFinished).toBe(true);
    });

    it('defaults seasonFinished to false when sport data is unavailable', async () => {
      getNBATeamData.mockRejectedValue(new Error('fail'));
      const [result] = await hydrateFavouriteTeams([nbaFav]);
      expect(result.seasonFinished).toBe(false);
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

  describe('hydrateFavouriteTeams — ESPN logo fallback', () => {
    it('uses ESPN CDN logo fallback for NBA when API provides no logo', async () => {
      getNBATeamData.mockResolvedValue({ ...liveSportData, logoUrl: null });
      const [result] = await hydrateFavouriteTeams([{ ...nbaFav, teamLogoUrl: '' }]);
      expect(result.teamLogoUrl).toMatch(/espncdn\.com/);
      expect(result.teamLogoUrl).toMatch(/nba/);
    });

    it('applies ESPN abbreviation overrides for known NBA teams (gsw → gs)', async () => {
      getNBATeamData.mockResolvedValue({ ...liveSportData, logoUrl: null });
      const [result] = await hydrateFavouriteTeams([{ ...nbaFav, teamId: 'nba-gsw' }]);
      expect(result.teamLogoUrl).toContain('/gs.png');
    });

    it('uses ESPN country logo fallback for WC teams', async () => {
      getWCTeamData.mockResolvedValue({ ...liveSportData, logoUrl: null });
      const [result] = await hydrateFavouriteTeams([{ ...wcFav, teamLogoUrl: '' }]);
      expect(result.teamLogoUrl).toMatch(/espncdn\.com/);
      expect(result.teamLogoUrl).toContain('/eng.png');
    });

    it('uses ESPN CDN logo fallback for NFL when the service provides no logo', async () => {
      getESPNTeamData.mockResolvedValue({ ...liveSportData, logoUrl: null });
      const [result] = await hydrateFavouriteTeams([{ ...nflFav, teamLogoUrl: '' }]);
      expect(result.teamLogoUrl).toMatch(/espncdn\.com/);
      expect(result.teamLogoUrl).toContain('/kc.png');
    });
  });
});
