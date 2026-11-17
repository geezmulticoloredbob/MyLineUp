const { validatePlayerLeagueParam, validatePlayerFavouritePayload } = require('../../validators/playersValidator');

function makeReq({ params = {}, body = {} } = {}) {
  return { params, body };
}

describe('playersValidator', () => {
  describe('validatePlayerLeagueParam', () => {
    it('calls next with no error for a league Player Pages supports', () => {
      const next = jest.fn();
      validatePlayerLeagueParam(makeReq({ params: { league: 'NFL' } }), {}, next);
      expect(next).toHaveBeenCalledWith();
    });

    it('rejects a league that exists in the app but has no Player Pages support yet (e.g. EPL)', () => {
      const next = jest.fn();
      validatePlayerLeagueParam(makeReq({ params: { league: 'EPL' } }), {}, next);
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 400, message: expect.stringContaining('EPL') })
      );
    });

    it('rejects a league that does not exist at all', () => {
      const next = jest.fn();
      validatePlayerLeagueParam(makeReq({ params: { league: 'NOT_A_LEAGUE' } }), {}, next);
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    });
  });

  describe('validatePlayerFavouritePayload', () => {
    const validBody = {
      league: 'NFL',
      playerId: '1',
      playerName: 'Alex Smith',
      teamId: 'nfl-kc',
    };

    it('calls next with no error for a valid payload', () => {
      const next = jest.fn();
      validatePlayerFavouritePayload(makeReq({ body: validBody }), {}, next);
      expect(next).toHaveBeenCalledWith();
    });

    it.each(['league', 'playerId', 'playerName', 'teamId'])('rejects a payload missing %s', (field) => {
      const next = jest.fn();
      const body = { ...validBody, [field]: undefined };
      validatePlayerFavouritePayload(makeReq({ body }), {}, next);
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 400, message: expect.stringContaining('required') })
      );
    });

    it.each(['playerId', 'playerName', 'teamId'])('rejects a payload where %s is not a string', (field) => {
      const next = jest.fn();
      const body = { ...validBody, [field]: 12345 };
      validatePlayerFavouritePayload(makeReq({ body }), {}, next);
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 400, message: expect.stringContaining('must be strings') })
      );
    });

    it('rejects a league that does not exist at all', () => {
      const next = jest.fn();
      const body = { ...validBody, league: 'NOT_A_LEAGUE' };
      validatePlayerFavouritePayload(makeReq({ body }), {}, next);
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 400, message: expect.stringContaining('league must be one of') })
      );
    });

    it('rejects a league that exists in the app but has no Player Pages support yet (e.g. EPL)', () => {
      const next = jest.fn();
      const body = { ...validBody, league: 'EPL' };
      validatePlayerFavouritePayload(makeReq({ body }), {}, next);
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 400, message: expect.stringContaining('EPL') })
      );
    });
  });
});
