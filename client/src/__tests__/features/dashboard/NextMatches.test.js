import { describe, expect, it } from 'vitest';
import { nextFixturePerSport } from '../../../features/dashboard/components/NextMatches.helpers';
import { SUPPORTED_LEAGUES } from '../../../constants/leagues';

const TODAY = '2026-09-07';

function team(favouriteId, league, nextFixture) {
  return { favouriteId, teamName: favouriteId, league, nextFixture };
}

describe('nextFixturePerSport', () => {
  it('returns one entry per sport, ordered by leagueOrder-derived sport order', () => {
    const teams = [
      team('t1', 'MLB', { date: '2026-09-10', utcDate: '2026-09-10T23:00:00Z' }),
      team('t2', 'NBA', { date: '2026-09-08', utcDate: '2026-09-08T23:00:00Z' }),
      team('t3', 'EPL', { date: '2026-09-09', utcDate: '2026-09-09T15:00:00Z' }),
    ];

    const result = nextFixturePerSport(teams, SUPPORTED_LEAGUES, TODAY);

    // BASKETBALL(NBA), SOCCER(EPL), BASEBALL(MLB) — in SUPPORTED_LEAGUES order
    expect(result.map((t) => t.favouriteId)).toEqual(['t2', 't3', 't1']);
  });

  it('picks the team with the soonest fixture when a sport has several followed teams', () => {
    const teams = [
      team('later', 'NBA', { date: '2026-09-15', utcDate: '2026-09-15T23:00:00Z' }),
      team('soonest', 'EPL', { date: '2026-09-08', utcDate: '2026-09-08T15:00:00Z' }),
      team('sooner', 'NBA', { date: '2026-09-09', utcDate: '2026-09-09T23:00:00Z' }),
    ];

    const result = nextFixturePerSport(teams, SUPPORTED_LEAGUES, TODAY);

    expect(result.map((t) => t.favouriteId)).toEqual(['sooner', 'soonest']);
  });

  it('excludes fixtures on or before today — those belong to the Today view instead', () => {
    const teams = [
      team('today', 'NBA', { date: TODAY, utcDate: `${TODAY}T23:00:00Z` }),
      team('past', 'EPL', { date: '2026-09-01', utcDate: '2026-09-01T15:00:00Z' }),
      team('future', 'AFL', { date: '2026-09-10', utcDate: '2026-09-10T05:00:00Z' }),
    ];

    const result = nextFixturePerSport(teams, SUPPORTED_LEAGUES, TODAY);

    expect(result.map((t) => t.favouriteId)).toEqual(['future']);
  });

  it('excludes teams with no upcoming fixture at all', () => {
    const teams = [
      team('no-fixture', 'NBA', null),
      team('has-fixture', 'EPL', { date: '2026-09-10', utcDate: '2026-09-10T15:00:00Z' }),
    ];

    const result = nextFixturePerSport(teams, SUPPORTED_LEAGUES, TODAY);

    expect(result.map((t) => t.favouriteId)).toEqual(['has-fixture']);
  });

  it('returns an empty array when nothing is upcoming', () => {
    const teams = [team('t1', 'NBA', { date: TODAY, utcDate: `${TODAY}T23:00:00Z` })];
    expect(nextFixturePerSport(teams, SUPPORTED_LEAGUES, TODAY)).toEqual([]);
  });
});
