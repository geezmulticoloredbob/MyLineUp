jest.mock('../../models/Favourite', () => ({
  find: jest.fn(),
  findOneAndUpdate: jest.fn(),
  findOneAndDelete: jest.fn(),
}));
jest.mock('mongoose', () => ({
  Types: { ObjectId: { isValid: jest.fn() } },
}));

const { getFavourites, saveFavourite, deleteFavourite } = require('../../controllers/favouritesController');
const Favourite = require('../../models/Favourite');
const mongoose = require('mongoose');

function makeRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

const mockUser = { _id: 'user-id-1' };

describe('favouritesController', () => {
  describe('getFavourites', () => {
    it('returns sorted favourites for the authenticated user', async () => {
      const faves = [{ teamId: 'nba-lal', teamName: 'Los Angeles Lakers' }];
      Favourite.find.mockReturnValue({ sort: jest.fn().mockResolvedValue(faves) });

      const res = makeRes();
      await getFavourites({ user: mockUser }, res, jest.fn());

      expect(Favourite.find).toHaveBeenCalledWith({ user: mockUser._id });
      expect(res.json).toHaveBeenCalledWith({ favourites: faves });
    });
  });

  describe('saveFavourite', () => {
    it('upserts and returns the favourite with status 201', async () => {
      const saved = { _id: 'fav-1', teamId: 'nba-lal', teamName: 'Los Angeles Lakers', league: 'NBA' };
      Favourite.findOneAndUpdate.mockResolvedValue(saved);

      const req = {
        user: mockUser,
        body: { league: 'NBA', teamId: 'nba-lal', teamName: 'Los Angeles Lakers', teamLogoUrl: '' },
      };
      const res = makeRes();
      await saveFavourite(req, res, jest.fn());

      expect(Favourite.findOneAndUpdate).toHaveBeenCalledWith(
        { user: mockUser._id, league: 'NBA', teamId: 'nba-lal' },
        expect.any(Object),
        expect.objectContaining({ upsert: true, returnDocument: 'after' }),
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ favourite: saved });
    });

    it('falls back to empty string when teamLogoUrl is not provided', async () => {
      Favourite.findOneAndUpdate.mockResolvedValue({});
      const req = { user: mockUser, body: { league: 'NBA', teamId: 'nba-lal', teamName: 'Lakers' } };
      await saveFavourite(req, makeRes(), jest.fn());
      const [, updateDoc] = Favourite.findOneAndUpdate.mock.calls[0];
      expect(updateDoc.teamLogoUrl).toBe('');
    });
  });

  describe('deleteFavourite', () => {
    it('responds with a success message when the favourite is deleted', async () => {
      mongoose.Types.ObjectId.isValid.mockReturnValue(true);
      Favourite.findOneAndDelete.mockResolvedValue({ _id: 'fav-1' });

      const res = makeRes();
      await deleteFavourite({ user: mockUser, params: { favouriteId: 'fav-1' } }, res, jest.fn());

      expect(Favourite.findOneAndDelete).toHaveBeenCalledWith({ _id: 'fav-1', user: mockUser._id });
      expect(res.json).toHaveBeenCalledWith({ message: 'Favourite removed' });
    });

    it('responds 404 when the favourite does not exist or belongs to another user', async () => {
      mongoose.Types.ObjectId.isValid.mockReturnValue(true);
      Favourite.findOneAndDelete.mockResolvedValue(null);

      const res = makeRes();
      await deleteFavourite({ user: mockUser, params: { favouriteId: 'other-fav' } }, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('responds 404 without hitting the DB when the id is not a valid ObjectId', async () => {
      mongoose.Types.ObjectId.isValid.mockReturnValue(false);

      const res = makeRes();
      await deleteFavourite({ user: mockUser, params: { favouriteId: 'not-an-id' } }, res, jest.fn());

      expect(Favourite.findOneAndDelete).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
