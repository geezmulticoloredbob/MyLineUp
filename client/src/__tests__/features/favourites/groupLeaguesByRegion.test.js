import { describe, it, expect } from 'vitest';
import { groupLeaguesByRegion } from '../../../features/favourites/utils/groupLeaguesByRegion';
import { SUPPORTED_LEAGUES, REGION_ORDER } from '../../../constants/leagues';

describe('groupLeaguesByRegion', () => {
  it('groups leagues under their region, in REGION_ORDER', () => {
    const result = groupLeaguesByRegion(['NBA', 'EPL', 'WC', 'AFL']);
    expect(result.map((g) => g.region)).toEqual(['INTERNATIONAL', 'NORTH_AMERICA', 'EUROPE', 'OCEANIA']);
    expect(result.find((g) => g.region === 'NORTH_AMERICA').leagues).toEqual(['NBA']);
  });

  it('keeps leagues within a region in their original relative order', () => {
    const result = groupLeaguesByRegion(['NHL', 'NBA', 'NFL']);
    expect(result[0].leagues).toEqual(['NHL', 'NBA', 'NFL']);
  });

  it('omits regions with no leagues in the input', () => {
    const result = groupLeaguesByRegion(['NBA']);
    expect(result).toHaveLength(1);
    expect(result[0].region).toBe('NORTH_AMERICA');
  });

  it('returns an empty array for no input', () => {
    expect(groupLeaguesByRegion([])).toEqual([]);
    expect(groupLeaguesByRegion(undefined)).toEqual([]);
  });

  it('puts a league with no mapped region in a trailing "Other" group rather than dropping it', () => {
    const result = groupLeaguesByRegion(['NBA', 'SOME_NEW_LEAGUE']);
    expect(result.at(-1)).toEqual({ region: 'OTHER', leagues: ['SOME_NEW_LEAGUE'] });
  });

  it('accounts for every currently supported league — none silently fall into "Other"', () => {
    const result = groupLeaguesByRegion(SUPPORTED_LEAGUES);
    const otherGroup = result.find((g) => g.region === 'OTHER');
    expect(otherGroup).toBeUndefined();

    const totalGrouped = result.reduce((n, g) => n + g.leagues.length, 0);
    expect(totalGrouped).toBe(SUPPORTED_LEAGUES.length);
  });

  it('never produces more region groups than REGION_ORDER plus the fallback', () => {
    const result = groupLeaguesByRegion(SUPPORTED_LEAGUES);
    expect(result.length).toBeLessThanOrEqual(REGION_ORDER.length + 1);
  });
});
