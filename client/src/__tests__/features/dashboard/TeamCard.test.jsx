import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import TeamCard from '../../../features/dashboard/components/TeamCard';
import { ThemeProvider } from '../../../contexts/ThemeContext';

// MatchesSection reads dateFormat off ThemeContext, so every render needs the provider.
function renderTeamCard(props) {
  return render(
    <ThemeProvider>
      <TeamCard {...props} />
    </ThemeProvider>
  );
}

const baseTeam = {
  favouriteId: 't1',
  teamId: 'nba-bos',
  teamName: 'Boston Celtics',
  league: 'NBA',
  teamLogoUrl: '',
  ladderPosition: 1,
  stats: { wins: 55, losses: 15 },
  latestResult: { outcome: 'W', opponent: 'Lakers', score: '110-105', date: new Date().toISOString().slice(0, 10) },
  nextFixture: null,
  topScorers: [],
  source: 'live',
  seasonFinished: false,
};

describe('TeamCard', () => {
  it('renders a skeleton when loading', () => {
    const { container } = renderTeamCard({ status: 'loading' });
    expect(container.querySelector('.team-card--skeleton')).not.toBeNull();
  });

  it('renders an error message when status is error', () => {
    renderTeamCard({ status: 'error', errorMessage: 'Network down' });
    expect(screen.getByText(/Could not load team data — Network down/)).toBeInTheDocument();
  });

  it('renders an empty state when there is no team', () => {
    renderTeamCard({ status: 'empty' });
    expect(screen.getByText('No favourite teams yet')).toBeInTheDocument();
  });

  it('renders team name, league, and W-L record for a live NBA team', () => {
    renderTeamCard({ team: baseTeam });
    expect(screen.getByText('Boston Celtics')).toBeInTheDocument();
    expect(screen.getByText('NBA')).toBeInTheDocument();
    expect(screen.getByText(/55-15/)).toBeInTheDocument();
  });

  it('renders a W-D-L record for a football-shaped stats object', () => {
    renderTeamCard({
      team: { ...baseTeam, league: 'EPL', stats: { won: 20, drawn: 5, lost: 3 } },
    });
    expect(screen.getByText(/20W 5D 3L/)).toBeInTheDocument();
  });

  it('shows the "No live data" badge when the source is unavailable', () => {
    renderTeamCard({ team: { ...baseTeam, source: 'unavailable' } });
    expect(screen.getByText('No live data')).toBeInTheDocument();
  });

  it('shows a champions badge for a finished season won outright', () => {
    renderTeamCard({ team: { ...baseTeam, seasonFinished: true, ladderPosition: 1 } });
    expect(screen.getByText(/Champions/)).toBeInTheDocument();
  });

  it('does not treat a World Cup group win as a championship', () => {
    renderTeamCard({ team: { ...baseTeam, league: 'WC', seasonFinished: true, ladderPosition: 1 } });
    expect(screen.queryByText(/🏆 Champions/)).not.toBeInTheDocument();
    expect(screen.getByText('Season Finished')).toBeInTheDocument();
  });

  it('falls back to placeholder values when the team object is sparse', () => {
    renderTeamCard({ team: { favouriteId: 't2' } });
    expect(screen.getByText('Unknown Team')).toBeInTheDocument();
  });
});
