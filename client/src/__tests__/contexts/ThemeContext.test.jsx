import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { ThemeProvider, useTheme } from '../../contexts/ThemeContext';
import { SUPPORTED_LEAGUES } from '../../constants/leagues';

function ExpandedSportsConsumer() {
  const { expandedSports, toggleSportExpand, expandSport } = useTheme();
  return (
    <>
      <p data-testid="expanded">{expandedSports.join(',')}</p>
      <button onClick={() => toggleSportExpand('BASKETBALL')}>toggle basketball</button>
      <button onClick={() => expandSport('SOCCER')}>expand soccer</button>
    </>
  );
}

function LeagueOrderConsumer() {
  const { leagueOrder, setLeagueOrder } = useTheme();
  return (
    <>
      <p data-testid="order">{leagueOrder.join(',')}</p>
      <button onClick={() => setLeagueOrder(['NHL', 'NBA'])}>set order</button>
    </>
  );
}

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('expandedSports', () => {
    it('starts empty so every sport section renders closed by default', () => {
      render(<ThemeProvider><ExpandedSportsConsumer /></ThemeProvider>);
      expect(screen.getByTestId('expanded')).toHaveTextContent('');
    });

    it('toggleSportExpand adds a sport, then removes it on a second call, persisting each change', () => {
      render(<ThemeProvider><ExpandedSportsConsumer /></ThemeProvider>);

      act(() => { screen.getByText('toggle basketball').click(); });
      expect(screen.getByTestId('expanded')).toHaveTextContent('BASKETBALL');
      expect(JSON.parse(localStorage.getItem('mylineup_expanded_sports'))).toEqual(['BASKETBALL']);

      act(() => { screen.getByText('toggle basketball').click(); });
      expect(screen.getByTestId('expanded')).toHaveTextContent('');
      expect(JSON.parse(localStorage.getItem('mylineup_expanded_sports'))).toEqual([]);
    });

    it('expandSport is idempotent — calling it again while already expanded does not duplicate', () => {
      render(<ThemeProvider><ExpandedSportsConsumer /></ThemeProvider>);

      act(() => { screen.getByText('expand soccer').click(); });
      act(() => { screen.getByText('expand soccer').click(); });

      expect(screen.getByTestId('expanded')).toHaveTextContent('SOCCER');
      expect(JSON.parse(localStorage.getItem('mylineup_expanded_sports'))).toEqual(['SOCCER']);
    });
  });

  describe('leagueOrder', () => {
    it('defaults to every supported league when nothing is stored', () => {
      render(<ThemeProvider><LeagueOrderConsumer /></ThemeProvider>);
      expect(screen.getByTestId('order')).toHaveTextContent(SUPPORTED_LEAGUES.join(','));
    });

    it('uses the stored order as-is when it already contains every league', () => {
      const fullOrder = [...SUPPORTED_LEAGUES].reverse();
      localStorage.setItem('mylineup_league_order', JSON.stringify(fullOrder));

      render(<ThemeProvider><LeagueOrderConsumer /></ThemeProvider>);
      expect(screen.getByTestId('order')).toHaveTextContent(fullOrder.join(','));
    });

    it('merges in leagues missing from a stale stored order instead of dropping them', () => {
      // Simulates a user's stored order predating a league added to the app later.
      const staleOrder = SUPPORTED_LEAGUES.filter((l) => l !== 'NHL' && l !== 'MLB');
      localStorage.setItem('mylineup_league_order', JSON.stringify(staleOrder));

      render(<ThemeProvider><LeagueOrderConsumer /></ThemeProvider>);
      expect(screen.getByTestId('order')).toHaveTextContent([...staleOrder, 'NHL', 'MLB'].join(','));
    });

    it('falls back to the default order when the stored value is malformed', () => {
      localStorage.setItem('mylineup_league_order', JSON.stringify({ not: 'an array' }));

      render(<ThemeProvider><LeagueOrderConsumer /></ThemeProvider>);
      expect(screen.getByTestId('order')).toHaveTextContent(SUPPORTED_LEAGUES.join(','));
    });

    it('setLeagueOrder updates state and persists the new order', () => {
      render(<ThemeProvider><LeagueOrderConsumer /></ThemeProvider>);

      act(() => { screen.getByText('set order').click(); });

      expect(screen.getByTestId('order')).toHaveTextContent('NHL,NBA');
      expect(JSON.parse(localStorage.getItem('mylineup_league_order'))).toEqual(['NHL', 'NBA']);
    });
  });
});
