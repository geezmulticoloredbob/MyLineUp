jest.mock('../../models/User', () => ({
  findByIdAndUpdate: jest.fn(),
}));

const { getFollowedLeagues, updateFollowedLeagues, completeOnboarding } = require('../../controllers/leagueController');
const User = require('../../models/User');

function makeRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

const mockUser = { _id: 'user-1', followedLeagues: ['NBA', 'EPL'] };

describe('leagueController', () => {
  describe('getFollowedLeagues', () => {
    it('returns the followedLeagues from req.user', async () => {
      const res = makeRes();
      await getFollowedLeagues({ user: mockUser }, res, jest.fn());
      expect(res.json).toHaveBeenCalledWith({ followedLeagues: ['NBA', 'EPL'] });
    });
  });

  describe('updateFollowedLeagues', () => {
    it('updates and returns the new followedLeagues', async () => {
      User.findByIdAndUpdate.mockResolvedValue({ followedLeagues: ['AFL'] });
      const res = makeRes();
      await updateFollowedLeagues({ user: mockUser, body: { leagues: ['AFL'] } }, res, jest.fn());
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUser._id,
        { followedLeagues: ['AFL'] },
        { new: true },
      );
      expect(res.json).toHaveBeenCalledWith({ followedLeagues: ['AFL'] });
    });

    it('throws 400 when leagues is not an array', async () => {
      const next = jest.fn();
      await updateFollowedLeagues({ user: mockUser, body: { leagues: 'NBA' } }, makeRes(), next);
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    });

    it('throws 400 when leagues contains an invalid code', async () => {
      const next = jest.fn();
      await updateFollowedLeagues({ user: mockUser, body: { leagues: ['NBA', 'INVALID'] } }, makeRes(), next);
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    });

    it('accepts an empty array to unfollow all leagues', async () => {
      User.findByIdAndUpdate.mockResolvedValue({ followedLeagues: [] });
      const res = makeRes();
      await updateFollowedLeagues({ user: mockUser, body: { leagues: [] } }, res, jest.fn());
      expect(res.json).toHaveBeenCalledWith({ followedLeagues: [] });
    });
  });

  describe('completeOnboarding', () => {
    it('sets onboardingComplete and returns true', async () => {
      User.findByIdAndUpdate.mockResolvedValue({});
      const res = makeRes();
      await completeOnboarding({ user: mockUser }, res, jest.fn());
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(mockUser._id, { onboardingComplete: true });
      expect(res.json).toHaveBeenCalledWith({ onboardingComplete: true });
    });
  });
});
