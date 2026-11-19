jest.mock('../../models/PlayerFavourite', () => ({
  find: jest.fn(),
  findOneAndUpdate: jest.fn(),
  findOneAndDelete: jest.fn(),
}));
jest.mock('../../services/espnPlayerService', () => ({
  getESPNRoster: jest.fn(),
}));
jest.mock('mongoose', () => ({
  Types: { ObjectId: { isValid: jest.fn() } },
}));

const {
  getRoster,
  getPlayerFavourites,
  savePlayerFavourite,
  deletePlayerFavourite,
} = require('../../controllers/playersController');
const PlayerFavourite = require('../../models/PlayerFavourite');
const { getESPNRoster } = require('../../services/espnPlayerService');
const mongoose = require('mongoose');

function makeRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

const mockUser = { _id: 'user-id-1' };

describe('playersController', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getRoster', () => {
    it('fetches the roster for the given league/team and returns it', async () => {
      const players = [{ id: '1', name: 'Alex Smith' }];
      getESPNRoster.mockResolvedValue(players);

      const req = { params: { league: 'NFL', teamId: 'nfl-kc' }, query: { teamName: 'Kansas City Chiefs' } };
      const res = makeRes();
      await getRoster(req, res, jest.fn());

      expect(getESPNRoster).toHaveBeenCalledWith('NFL', { teamId: 'nfl-kc', teamName: 'Kansas City Chiefs' });
      expect(res.json).toHaveBeenCalledWith({ players });
    });

    it('defaults teamName to an empty string when not provided', async () => {
      getESPNRoster.mockResolvedValue([]);

      const req = { params: { league: 'NBA', teamId: 'nba-lal' }, query: {} };
      await getRoster(req, makeRes(), jest.fn());

      expect(getESPNRoster).toHaveBeenCalledWith('NBA', { teamId: 'nba-lal', teamName: '' });
    });

    it('wraps a roster-fetch failure in a 502 ApiError rather than leaking the raw error', async () => {
      getESPNRoster.mockRejectedValue(new Error('ESPN is down'));

      const req = { params: { league: 'NFL', teamId: 'nfl-kc' }, query: {} };
      const next = jest.fn();
      await getRoster(req, makeRes(), next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 502, message: expect.stringContaining('ESPN is down') })
      );
    });
  });

  describe('getPlayerFavourites', () => {
    it('returns favourites for the authenticated user, sorted by league then player name', async () => {
      const favourites = [{ playerName: 'Alex Smith', league: 'NFL' }];
      PlayerFavourite.find.mockReturnValue({ sort: jest.fn().mockResolvedValue(favourites) });

      const res = makeRes();
      await getPlayerFavourites({ user: mockUser }, res, jest.fn());

      expect(PlayerFavourite.find).toHaveBeenCalledWith({ user: mockUser._id });
      expect(res.json).toHaveBeenCalledWith({ favourites });
    });
  });

  describe('savePlayerFavourite', () => {
    it('upserts and returns the favourite with status 201', async () => {
      const saved = { _id: 'pf-1', league: 'NFL', playerId: '1', playerName: 'Alex Smith' };
      PlayerFavourite.findOneAndUpdate.mockResolvedValue(saved);

      const req = {
        user: mockUser,
        body: {
          league: 'NFL',
          playerId: '1',
          playerName: 'Alex Smith',
          teamId: 'nfl-kc',
          teamName: 'Kansas City Chiefs',
          position: 'QB',
          headshotUrl: 'http://example.com/1.png',
        },
      };
      const res = makeRes();
      await savePlayerFavourite(req, res, jest.fn());

      expect(PlayerFavourite.findOneAndUpdate).toHaveBeenCalledWith(
        { user: mockUser._id, league: 'NFL', playerId: '1' },
        expect.objectContaining({
          teamName: 'Kansas City Chiefs',
          position: 'QB',
          headshotUrl: 'http://example.com/1.png',
        }),
        expect.objectContaining({ upsert: true, returnDocument: 'after', setDefaultsOnInsert: true })
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ favourite: saved });
    });

    it('falls back to empty strings for optional fields when not provided', async () => {
      PlayerFavourite.findOneAndUpdate.mockResolvedValue({});
      const req = {
        user: mockUser,
        body: { league: 'NFL', playerId: '1', playerName: 'Alex Smith', teamId: 'nfl-kc' },
      };
      await savePlayerFavourite(req, makeRes(), jest.fn());

      const [, updateDoc] = PlayerFavourite.findOneAndUpdate.mock.calls[0];
      expect(updateDoc.teamName).toBe('');
      expect(updateDoc.position).toBe('');
      expect(updateDoc.headshotUrl).toBe('');
    });
  });

  describe('deletePlayerFavourite', () => {
    it('responds with a success message when the favourite is deleted', async () => {
      mongoose.Types.ObjectId.isValid.mockReturnValue(true);
      PlayerFavourite.findOneAndDelete.mockResolvedValue({ _id: 'pf-1' });

      const res = makeRes();
      await deletePlayerFavourite({ user: mockUser, params: { favouriteId: 'pf-1' } }, res, jest.fn());

      expect(PlayerFavourite.findOneAndDelete).toHaveBeenCalledWith({ _id: 'pf-1', user: mockUser._id });
      expect(res.json).toHaveBeenCalledWith({ message: 'Player favourite removed' });
    });

    it('responds 404 when the favourite does not exist or belongs to another user', async () => {
      mongoose.Types.ObjectId.isValid.mockReturnValue(true);
      PlayerFavourite.findOneAndDelete.mockResolvedValue(null);

      const next = jest.fn();
      await deletePlayerFavourite({ user: mockUser, params: { favouriteId: 'other-fav' } }, makeRes(), next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
    });

    it('responds 404 without hitting the DB when the id is not a valid ObjectId', async () => {
      mongoose.Types.ObjectId.isValid.mockReturnValue(false);

      const next = jest.fn();
      await deletePlayerFavourite({ user: mockUser, params: { favouriteId: 'not-an-id' } }, makeRes(), next);

      expect(PlayerFavourite.findOneAndDelete).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
    });
  });
});
