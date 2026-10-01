import { render, screen, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import LeagueCard, { SkeletonLeagueCard } from '../../../features/dashboard/components/LeagueCard';

function standingsRow(position, teamName, overrides = {}) {
  return { position, teamName, stats: { wins: 20 - position, losses: position }, ...overrides };
}

describe('SkeletonLeagueCard', () => {
  it('renders skeleton placeholder structure', () => {
    const { container } = render(<SkeletonLeagueCard />);
    expect(container.querySelector('.lc-skeleton-header')).not.toBeNull();
    expect(container.querySelectorAll('.lc-section')).toHaveLength(3);
  });
});

describe('LeagueCard', () => {
  it('renders the league display name in the header', () => {
    render(<LeagueCard league="NBA" standings={[]} recentResults={[]} upcomingFixtures={[]} />);
    expect(screen.getByText('NBA')).toBeInTheDocument();
  });

  it('shows "Unavailable" when standings is null', () => {
    render(<LeagueCard league="EPL" standings={null} recentResults={[]} upcomingFixtures={[]} />);
    expect(screen.getByText('Unavailable')).toBeInTheDocument();
  });

  it('previews only the first 5 standings rows, with a toggle to show the rest', () => {
    const standings = Array.from({ length: 8 }, (_, i) => standingsRow(i + 1, `Team ${i + 1}`));
    render(<LeagueCard league="NBA" standings={standings} recentResults={[]} upcomingFixtures={[]} />);

    expect(screen.getByText('Team 5')).toBeInTheDocument();
    expect(screen.queryByText('Team 6')).not.toBeInTheDocument();

    const toggle = screen.getByRole('button', { name: /Show full table \(8\)/ });
    act(() => { toggle.click(); });

    expect(screen.getByText('Team 6')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Show top 5/ })).toBeInTheDocument();
  });

  it('does not render a toggle when there are 5 or fewer standings rows', () => {
    const standings = Array.from({ length: 3 }, (_, i) => standingsRow(i + 1, `Team ${i + 1}`));
    render(<LeagueCard league="NBA" standings={standings} recentResults={[]} upcomingFixtures={[]} />);
    expect(screen.queryByRole('button', { name: /Show full table/ })).not.toBeInTheDocument();
  });

  it('marks the top standings row with a champion icon once the season is complete', () => {
    const standings = [standingsRow(1, 'Winners')];
    render(
      <LeagueCard league="NBA" standings={standings} recentResults={[{ date: '2026-01-01', homeTeam: 'A', awayTeam: 'B', homeScore: 1, awayScore: 0 }]} upcomingFixtures={[]} />
    );
    expect(screen.getByLabelText('Season champion')).toBeInTheDocument();
  });

  it('shows "No recent results" and "No upcoming fixtures" when both are empty', () => {
    render(<LeagueCard league="NBA" standings={[]} recentResults={[]} upcomingFixtures={[]} />);
    expect(screen.getByText('No recent results')).toBeInTheDocument();
    expect(screen.getByText('No upcoming fixtures')).toBeInTheDocument();
  });

  it('renders recent results with team names and score', () => {
    render(
      <LeagueCard
        league="NBA"
        standings={[]}
        recentResults={[{ date: '2026-01-01', homeTeam: 'Celtics', awayTeam: 'Lakers', homeScore: 110, awayScore: 105 }]}
        upcomingFixtures={[]}
      />
    );
    expect(screen.getByText('Celtics')).toBeInTheDocument();
    expect(screen.getByText('Lakers')).toBeInTheDocument();
    expect(screen.getByText('110–105')).toBeInTheDocument();
  });

  it('renders wins/losses stat columns for every ESPN- and cricket-routed league, not just NBA/AFL/NFL/NHL/MLB', () => {
    // Regression test: these leagues were missing from STANDINGS_STATS
    // entirely when first shipped, silently rendering standings with no
    // stat columns at all.
    for (const league of ['NRL', 'WNBA', 'NWSL', 'ALEAGUE', 'ARGENTINA', 'IPL', 'BBL']) {
      const { unmount } = render(
        <LeagueCard league={league} standings={[standingsRow(1, 'Team A')]} recentResults={[]} upcomingFixtures={[]} />
      );
      expect(screen.getByRole('columnheader', { name: 'W' })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'L' })).toBeInTheDocument();
      unmount();
    }
  });

  it('splits a conference/group-tagged standings list into separate per-group tables instead of one interleaved table', () => {
    const standings = [
      standingsRow(1, 'Chiefs', { group: 'AFC' }),
      standingsRow(2, 'Bills', { group: 'AFC' }),
      standingsRow(1, 'Seahawks', { group: 'NFC' }),
      standingsRow(2, 'Eagles', { group: 'NFC' }),
    ];
    render(<LeagueCard league="NFL" standings={standings} recentResults={[]} upcomingFixtures={[]} />);

    expect(screen.getByText('AFC')).toBeInTheDocument();
    expect(screen.getByText('NFC')).toBeInTheDocument();
    // Two separate tables, each with its own 2 rows — not one flat table
    // interleaving "1. Chiefs, 1. Seahawks, 2. Bills, 2. Eagles".
    const tables = document.querySelectorAll('table.lc-table');
    expect(tables).toHaveLength(2);
    expect(tables[0].querySelectorAll('tbody tr')).toHaveLength(2);
    expect(tables[1].querySelectorAll('tbody tr')).toHaveLength(2);
  });

  it('previews 3 rows per group for a grouped league, with a toggle to show the rest', () => {
    const standings = [
      ...Array.from({ length: 5 }, (_, i) => standingsRow(i + 1, `AFC Team ${i + 1}`, { group: 'AFC' })),
      ...Array.from({ length: 5 }, (_, i) => standingsRow(i + 1, `NFC Team ${i + 1}`, { group: 'NFC' })),
    ];
    render(<LeagueCard league="NFL" standings={standings} recentResults={[]} upcomingFixtures={[]} />);

    expect(screen.getByText('AFC Team 3')).toBeInTheDocument();
    expect(screen.queryByText('AFC Team 4')).not.toBeInTheDocument();
    expect(screen.getByText('NFC Team 3')).toBeInTheDocument();
    expect(screen.queryByText('NFC Team 4')).not.toBeInTheDocument();

    const toggle = screen.getByRole('button', { name: /Show full table \(10\)/ });
    act(() => { toggle.click(); });

    expect(screen.getByText('AFC Team 5')).toBeInTheDocument();
    expect(screen.getByText('NFC Team 5')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Show top 3/ })).toBeInTheDocument();
  });

  it('does not treat a single-group league as grouped (falls back to the one flat table)', () => {
    // Every non-conference league's rows either omit `group` entirely or
    // carry the same null group for every row — neither should trigger the
    // per-group rendering path.
    const standings = [
      standingsRow(1, 'Celtic', { group: null }),
      standingsRow(2, 'Rangers', { group: null }),
    ];
    render(<LeagueCard league="SCOTLAND" standings={standings} recentResults={[]} upcomingFixtures={[]} />);

    expect(document.querySelectorAll('.lc-standings-group')).toHaveLength(0);
    expect(document.querySelectorAll('table')).toHaveLength(1);
  });

  it('renders upcoming fixtures with team names', () => {
    render(
      <LeagueCard
        league="NBA"
        standings={[]}
        recentResults={[]}
        upcomingFixtures={[{ date: '2099-01-01', homeTeam: 'Celtics', awayTeam: 'Lakers' }]}
      />
    );
    expect(screen.getByText('Celtics')).toBeInTheDocument();
    expect(screen.getByText('Lakers')).toBeInTheDocument();
    expect(screen.getByText('vs')).toBeInTheDocument();
  });
});
