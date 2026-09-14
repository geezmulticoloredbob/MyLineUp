import { describe, it, expect } from 'vitest';
import { getRecentForm } from '../../../features/dashboard/utils/formTrend';

// capturedOn (the day the snapshot was taken) and date (the game's own date)
// are deliberately separate params — a team's "latest result" keeps the same
// game date across several days of snapshots until it actually plays again.
function snapshot(capturedOn, date, opponent, score, outcome) {
  return { capturedOn, latestResult: { date, opponent, score, outcome } };
}

describe('getRecentForm', () => {
  it('returns an empty array for no history', () => {
    expect(getRecentForm([])).toEqual([]);
    expect(getRecentForm(undefined)).toEqual([]);
  });

  it('collapses consecutive snapshots describing the same game into one entry', () => {
    const history = [
      snapshot('2026-09-01', '2026-08-30', 'Lakers', '110-105', 'W'),
      snapshot('2026-09-02', '2026-08-30', 'Lakers', '110-105', 'W'), // same game, re-captured the next day
      snapshot('2026-09-03', '2026-08-30', 'Lakers', '110-105', 'W'),
    ];

    expect(getRecentForm(history)).toEqual([{ date: '2026-08-30', opponent: 'Lakers', score: '110-105', outcome: 'W' }]);
  });

  it('keeps each distinct game once it changes', () => {
    const history = [
      snapshot('2026-09-01', '2026-08-30', 'Lakers', '110-105', 'W'),
      snapshot('2026-09-03', '2026-09-02', 'Warriors', '98-101', 'L'),
      snapshot('2026-09-05', '2026-09-04', 'Nets', '90-88', 'W'),
    ];

    expect(getRecentForm(history)).toEqual([
      { date: '2026-08-30', opponent: 'Lakers', score: '110-105', outcome: 'W' },
      { date: '2026-09-02', opponent: 'Warriors', score: '98-101', outcome: 'L' },
      { date: '2026-09-04', opponent: 'Nets', score: '90-88', outcome: 'W' },
    ]);
  });

  it('skips snapshots with no result at all, without breaking the run of the previous result', () => {
    const history = [
      snapshot('2026-09-01', '2026-08-30', 'Lakers', '110-105', 'W'),
      { capturedOn: '2026-09-02', latestResult: null },
      snapshot('2026-09-03', '2026-09-02', 'Warriors', '98-101', 'L'),
    ];

    expect(getRecentForm(history)).toEqual([
      { date: '2026-08-30', opponent: 'Lakers', score: '110-105', outcome: 'W' },
      { date: '2026-09-02', opponent: 'Warriors', score: '98-101', outcome: 'L' },
    ]);
  });

  it('caps the result at the given limit, keeping the most recent', () => {
    const history = Array.from({ length: 8 }, (_, i) =>
      snapshot(`2026-09-0${i + 1}`, `2026-09-0${i + 1}`, `Opponent ${i}`, '1-0', 'W')
    );

    const form = getRecentForm(history, 5);
    expect(form).toHaveLength(5);
    expect(form[0].opponent).toBe('Opponent 3');
    expect(form[4].opponent).toBe('Opponent 7');
  });
});
