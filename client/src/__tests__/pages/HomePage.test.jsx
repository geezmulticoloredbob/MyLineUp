import { render, screen, within, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import HomePage from '../../pages/HomePage';
import { AuthProvider } from '../../contexts/AuthContext';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { FavouritesProvider } from '../../contexts/FavouritesContext';
import * as apiClientModule from '../../services/apiClient';
import * as authApi from '../../features/auth/services/authApi';

vi.mock('../../services/apiClient');
vi.mock('../../features/auth/services/authApi');

const team = (favouriteId, teamName, league, overrides = {}) => ({
  favouriteId,
  teamId: favouriteId,
  teamName,
  league,
  teamLogoUrl: '',
  ladderPosition: 1,
  stats: { wins: 10, losses: 5 },
  latestResult: { outcome: 'W', opponent: 'Rival', score: '2-1', date: '2026-08-10' },
  nextFixture: { opponent: 'Next Opponent', venue: 'Home', date: '2099-01-01', utcDate: '2099-01-01T20:00:00Z' },
  topScorers: [],
  source: 'live',
  seasonFinished: false,
  ...overrides,
});

function renderHomePage() {
  return render(
    <AuthProvider>
      <ThemeProvider>
        <FavouritesProvider>
          <HomePage />
        </FavouritesProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

// The accordion body's content stays mounted at every state — only the
// wrapping div's class toggles the CSS grid-rows transition that shows/hides
// it (see .team-group__body / --open in index.css) — so `--open` presence is
// what actually reflects "is this section visible", not DOM presence of its
// content.
function isBodyOpen(toggleButton) {
  const body = toggleButton.closest('.team-group').querySelector('.team-group__body');
  return body.classList.contains('team-group__body--open');
}

// Both the team-strip's sport tile and the team-group's section title share
// the sport's display name as their accessible name — scope to .team-groups
// to get the one under test unambiguously.
function getGroupToggle(container, name) {
  const teamGroups = container.querySelector('.team-groups');
  return within(teamGroups).getByRole('button', { name: new RegExp(name) });
}

describe('HomePage sport-group accordion', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    authApi.fetchCurrentUser.mockRejectedValue(new Error('Unauthorized'));
    apiClientModule.apiClient.mockResolvedValue({
      teams: [
        team('t1', 'Boston Celtics', 'NBA'),
        team('t2', 'Arsenal', 'EPL'),
      ],
      leagueOverviews: [],
    });
  });

  it('renders every sport group closed by default', async () => {
    const { container } = renderHomePage();
    await screen.findAllByText('Boston Celtics');

    const basketballToggle = getGroupToggle(container, 'Basketball');
    const soccerToggle = getGroupToggle(container, 'Soccer');

    expect(basketballToggle).toHaveAttribute('aria-expanded', 'false');
    expect(isBodyOpen(basketballToggle)).toBe(false);
    expect(soccerToggle).toHaveAttribute('aria-expanded', 'false');
    expect(isBodyOpen(soccerToggle)).toBe(false);
  });

  it('expands a sport group on click, without affecting other groups', async () => {
    const { container } = renderHomePage();
    await screen.findAllByText('Boston Celtics');

    const basketballToggle = getGroupToggle(container, 'Basketball');
    const soccerToggle = getGroupToggle(container, 'Soccer');

    act(() => { basketballToggle.click(); });

    expect(basketballToggle).toHaveAttribute('aria-expanded', 'true');
    expect(isBodyOpen(basketballToggle)).toBe(true);
    // Soccer group is untouched by expanding Basketball
    expect(soccerToggle).toHaveAttribute('aria-expanded', 'false');
    expect(isBodyOpen(soccerToggle)).toBe(false);
  });

  it('collapses an expanded sport group on a second click', async () => {
    const { container } = renderHomePage();
    await screen.findAllByText('Boston Celtics');

    const basketballToggle = getGroupToggle(container, 'Basketball');

    act(() => { basketballToggle.click(); });
    expect(basketballToggle).toHaveAttribute('aria-expanded', 'true');

    act(() => { basketballToggle.click(); });
    expect(basketballToggle).toHaveAttribute('aria-expanded', 'false');
    expect(isBodyOpen(basketballToggle)).toBe(false);
  });

  it('persists expanded state across a remount, via ThemeContext + localStorage', async () => {
    const first = renderHomePage();
    await screen.findAllByText('Boston Celtics');

    const basketballToggle = getGroupToggle(first.container, 'Basketball');
    act(() => { basketballToggle.click(); });
    expect(basketballToggle).toHaveAttribute('aria-expanded', 'true');

    first.unmount();
    const second = renderHomePage();
    await screen.findAllByText('Boston Celtics');

    await waitFor(() => {
      expect(getGroupToggle(second.container, 'Basketball')).toHaveAttribute('aria-expanded', 'true');
    });
  });
});
