import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import PlayerCard from '../../../features/dashboard/components/PlayerCard';

const basePlayer = {
  favouriteId: 'pf1',
  playerId: '111',
  playerName: 'Patrick Mahomes',
  teamId: 'nfl-kc',
  teamName: 'Kansas City Chiefs',
  league: 'NFL',
  position: 'QB',
  headshotUrl: '',
  stats: [{ label: 'PASS YDS', value: '4183' }],
  dataAvailable: true,
  source: 'live',
};

describe('PlayerCard', () => {
  it('renders a skeleton when loading', () => {
    const { container } = render(<PlayerCard status="loading" />);
    expect(container.querySelector('.team-card--skeleton')).not.toBeNull();
  });

  it('renders an empty state when there is no player', () => {
    render(<PlayerCard player={null} />);
    expect(screen.getByText('No favourite players yet')).toBeInTheDocument();
  });

  it('renders player name, position, team and league', () => {
    render(<PlayerCard player={basePlayer} />);
    expect(screen.getByText('Patrick Mahomes')).toBeInTheDocument();
    expect(screen.getByText('QB · Kansas City Chiefs · NFL')).toBeInTheDocument();
  });

  it('renders each stat label and value', () => {
    render(<PlayerCard player={basePlayer} />);
    expect(screen.getByText('PASS YDS')).toBeInTheDocument();
    expect(screen.getByText('4183')).toBeInTheDocument();
  });

  it('shows the "No live data" badge when the source is unavailable', () => {
    render(<PlayerCard player={{ ...basePlayer, source: 'unavailable', stats: [] }} />);
    expect(screen.getByText('No live data')).toBeInTheDocument();
    expect(screen.queryByText('Season Stats')).not.toBeInTheDocument();
  });

  it('shows a fallback message when live but there are no stats yet', () => {
    render(<PlayerCard player={{ ...basePlayer, stats: [] }} />);
    expect(screen.getByText('No stats available yet')).toBeInTheDocument();
  });
});
