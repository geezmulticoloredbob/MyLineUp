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
