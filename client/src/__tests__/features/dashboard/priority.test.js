import { describe, it, expect, vi, afterEach } from 'vitest';
import { getNextGamePanel } from '../../../features/dashboard/utils/priority';

function team(date) {
  return { nextFixture: { date, opponent: 'Ipswich Town', venue: 'Home' } };
}

describe('getNextGamePanel', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('treats a game later today as upcoming, not outside the window', () => {
    // Date-only fixtures parse to local midnight, which is already in the
    // past by the afternoon of match day.
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 17, 13, 0));

    expect(getNextGamePanel(team('2026-10-17')).content).toBe('vs Ipswich Town at Home');
  });

  it('treats a game on the last day of the window as upcoming', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 17, 23, 30));

    expect(getNextGamePanel(team('2026-11-16')).content).toBe('vs Ipswich Town at Home');
  });

  it('reports a game beyond the window', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 17, 13, 0));

    expect(getNextGamePanel(team('2026-11-17')).content).toBe('No game in the next 30 days');
  });

  it('reports a fixture dated before today as outside the window', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 17, 13, 0));

    expect(getNextGamePanel(team('2026-10-16')).content).toBe('No game in the next 30 days');
  });
});
