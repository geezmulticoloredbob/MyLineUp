import { useEffect, useMemo, useRef, useState } from 'react';
import { GripVertical } from 'lucide-react';
import { apiClient } from '../services/apiClient';
import { useFavouritesRefresh } from '../contexts/FavouritesContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { usePageTitle } from '../hooks/usePageTitle';
import PageContainer from '../components/common/PageContainer';
import ErrorBoundary from '../components/common/ErrorBoundary';
import TeamCard from '../features/dashboard/components/TeamCard';
import LeagueCard, { SkeletonLeagueCard } from '../features/dashboard/components/LeagueCard';
import GamesFeed from '../features/dashboard/components/GamesFeed';

const LOGO_FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' fill='%23333'/%3E%3Ccircle cx='20' cy='15' r='6' fill='%23555'/%3E%3Cpath d='M8 36c0-6.627 5.373-12 12-12s12 5.373 12 12' fill='%23555'/%3E%3C/svg%3E";

const LEAGUE_ORDER = ['NBA', 'EPL', 'AFL'];

function TeamLogoStrip({ teams }) {
  function scrollToTeam(favouriteId) {
    document.getElementById(`team-${favouriteId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const grouped = LEAGUE_ORDER.reduce((acc, league) => {
    const leagueTeams = teams.filter((t) => t.league === league);
    if (leagueTeams.length) acc[league] = leagueTeams;
    return acc;
  }, {});

  return (
    <div className="team-strip">
      {Object.entries(grouped).map(([league, leagueTeams]) => (
        <div key={league} className="team-strip__group">
          <span className="team-strip__league-label">{league}</span>
          <div className="team-strip__items">
            {leagueTeams.map((team) => (
              <button
                key={team.favouriteId}
                type="button"
                className={`team-strip__item team-strip__item--${league.toLowerCase()}`}
                onClick={() => scrollToTeam(team.favouriteId)}
                title={team.teamName}
              >
                <img
                  className="team-strip__logo"
                  src={team.teamLogoUrl || LOGO_FALLBACK}
                  alt={team.teamName}
                  width={40}
                  height={40}
                />
                <span className="team-strip__name">{team.teamName}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ onOpen }) {
  return (
    <div className="empty-state">
      <p className="empty-state__title">Nothing here yet</p>
      <p className="empty-state__body">Follow some teams or leagues to fill your dashboard.</p>
      <button className="btn-primary" type="button" onClick={onOpen}>
        Add teams &amp; leagues
      </button>
    </div>
  );
}

function HomePage() {
  usePageTitle('Dashboard');
  const { refreshTick, openManager } = useFavouritesRefresh();
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [leagueOverviews, setLeagueOverviews] = useState([]);
  const [status, setStatus] = useState('loading');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setStatus('loading');
    apiClient('/api/dashboard', { signal: controller.signal })
      .then(({ teams, leagueOverviews }) => {
        setTeams(teams);
        setLeagueOverviews(leagueOverviews || []);
        setStatus(teams.length === 0 && (leagueOverviews?.length ?? 0) === 0 ? 'empty' : 'ready');
        const bgTeams = teams.map(({ teamName, teamId, league }) => ({ teamName, teamId, league }));
        localStorage.setItem('mylineup_bg_teams', JSON.stringify(bgTeams));
      })
      .catch((err) => { if (err.name !== 'AbortError') setStatus('error'); });
    return () => controller.abort();
  }, [refreshTick, retryCount]);

  if (status === 'loading') {
    const followedLeagues = user?.followedLeagues ?? [];
    return (
      <PageContainer title="Your Teams">
        <div className="team-card-grid">
          <TeamCard status="loading" />
          <TeamCard status="loading" />
          <TeamCard status="loading" />
        </div>
        {followedLeagues.length > 0 && (
          <div className="league-card-grid">
            {followedLeagues.map((l) => <SkeletonLeagueCard key={l} />)}
          </div>
        )}
      </PageContainer>
    );
  }

  if (status === 'error') {
    return (
      <PageContainer title="Your Teams">
        <div className="empty-state">
          <p className="empty-state__title">Could not load dashboard</p>
          <p className="empty-state__body">Unable to reach the sports service.</p>
          <button className="btn-primary" type="button" onClick={() => setRetryCount((c) => c + 1)}>
            Try again
          </button>
        </div>
      </PageContainer>
    );
  }

  if (status === 'empty') {
    return (
      <PageContainer title="Your Teams">
        <EmptyState onOpen={openManager} />
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Your Teams">
      {teams.length > 0 && <TeamLogoStrip teams={teams} />}
      <GamesFeed teams={teams} />
      {teams.length > 0 && (
        <ErrorBoundary>
          <div className="team-card-grid">
            {teams.map((team) => (
              <div id={`team-${team.favouriteId}`} key={team.favouriteId}>
                <TeamCard team={team} />
              </div>
            ))}
          </div>
        </ErrorBoundary>
      )}
      {leagueOverviews.length > 0 && (
        <ErrorBoundary>
          <div className="league-card-grid">
            {leagueOverviews.map((overview) => (
              <LeagueCard key={overview.league} {...overview} />
            ))}
          </div>
        </ErrorBoundary>
      )}
    </PageContainer>
  );
}

export default HomePage;
