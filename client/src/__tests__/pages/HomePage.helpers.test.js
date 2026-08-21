import { describe, expect, it } from 'vitest';
import { sportOf, uniqueSportsInOrder, moveSportBlock } from '../../pages/HomePage';

describe('sportOf', () => {
  it('maps a known league to its sport', () => {
    expect(sportOf('NBA')).toBe('BASKETBALL');
    expect(sportOf('EPL')).toBe('SOCCER');
    expect(sportOf('AFL')).toBe('AFL');
    expect(sportOf('NFL')).toBe('GRIDIRON');
    expect(sportOf('NHL')).toBe('HOCKEY');
    expect(sportOf('MLB')).toBe('BASEBALL');
  });

  it('groups every soccer-family league under SOCCER', () => {
    ['EPL', 'WC', 'LALIGA', 'BUNDESLIGA', 'SERIEA', 'LIGUE1', 'CHAMPIONSHIP', 'EREDIVISIE', 'UCL'].forEach((league) => {
      expect(sportOf(league)).toBe('SOCCER');
    });
  });

  it('falls back to the league itself when unrecognised', () => {
    expect(sportOf('UNKNOWN')).toBe('UNKNOWN');
  });
});

describe('uniqueSportsInOrder', () => {
  it('returns sports in first-seen order with no duplicates', () => {
    expect(uniqueSportsInOrder(['NBA', 'EPL', 'LALIGA', 'NBA', 'AFL'])).toEqual(['BASKETBALL', 'SOCCER', 'AFL']);
  });

  it('returns an empty array for an empty list', () => {
    expect(uniqueSportsInOrder([])).toEqual([]);
  });

  it('derives the league from each item via getLeague', () => {
    const teams = [{ league: 'NFL' }, { league: 'NHL' }, { league: 'NFL' }];
    expect(uniqueSportsInOrder(teams, (t) => t.league)).toEqual(['GRIDIRON', 'HOCKEY']);
  });
});

describe('moveSportBlock', () => {
  it('returns the same order unchanged when from and to sports match', () => {
    const order = ['NBA', 'EPL', 'AFL'];
    expect(moveSportBlock(order, 'BASKETBALL', 'BASKETBALL')).toBe(order);
  });

  it('moves every league of a sport as a contiguous block to another sport\'s position', () => {
    // BASKETBALL(NBA), SOCCER(EPL, LALIGA), AFL(AFL) -> move AFL to sit where SOCCER is
    const order = ['NBA', 'EPL', 'LALIGA', 'AFL'];
    expect(moveSportBlock(order, 'AFL', 'SOCCER')).toEqual(['NBA', 'AFL', 'EPL', 'LALIGA']);
  });

  it('preserves league order within each sport after the move', () => {
    const order = ['EPL', 'LALIGA', 'NBA', 'NFL', 'NHL'];
    // Move SOCCER's block to sit immediately before HOCKEY; EPL/LALIGA order between themselves is unchanged
    expect(moveSportBlock(order, 'SOCCER', 'HOCKEY')).toEqual(['NBA', 'NFL', 'EPL', 'LALIGA', 'NHL']);
  });
});
