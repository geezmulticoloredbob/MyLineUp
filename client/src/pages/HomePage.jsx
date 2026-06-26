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

function TeamLogoStrip({ teams, leagueOrder, teamOrder, onLeagueReorder, onTeamReorder }) {
  const dragLeague = useRef(null);
  const dragTeam = useRef(null);
  const [dragOverLeague, setDragOverLeague] = useState(null);
  const [dragOverTeam, setDragOverTeam] = useState(null);

  function scrollToTeam(favouriteId) {
    document.getElementById(`team-${favouriteId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const sortedTeams = [...teams].sort((a, b) => {
    const ai = teamOrder.indexOf(a.favouriteId);
    const bi = teamOrder.indexOf(b.favouriteId);
    return (ai === -1 ? 9999 : ai) - (bi === -1 ? 9999 : bi);
  });

  const grouped = leagueOrder.reduce((acc, league) => {
    const leagueTeams = sortedTeams.filter((t) => t.league === league);
    if (leagueTeams.length) acc[league] = leagueTeams;
    return acc;
  }, {});

  function onLeagueDragStart(e, league) {
    dragLeague.current = league;
    e.dataTransfer.effectAllowed = 'move';
  }
  function onLeagueDragOver(e, league) {
    e.preventDefault();
    if (dragLeague.current && dragLeague.current !== league) setDragOverLeague(league);
  }
  function onLeagueDrop(e, targetLeague) {
    e.preventDefault();
    if (!dragLeague.current || dragLeague.current === targetLeague) return;
    const next = [...leagueOrder];
    next.splice(next.indexOf(dragLeague.current), 1);
    next.splice(next.indexOf(targetLeague), 0, dragLeague.current);
    onLeagueReorder(next);
    dragLeague.current = null;
    setDragOverLeague(null);
  }
  function onLeagueDragEnd() {
    dragLeague.current = null;
    setDragOverLeague(null);
  }

  function onTeamDragStart(e, teamId, league) {
    e.stopPropagation();
    dragTeam.current = { id: teamId, league };
    e.dataTransfer.effectAllowed = 'move';
  }
  function onTeamDragOver(e, teamId, league) {
    e.preventDefault();
    e.stopPropagation();
    if (dragTeam.current?.id !== teamId && dragTeam.current?.league === league) {
      setDragOverTeam(teamId);
    }
  }
  function onTeamDrop(e, targetId) {
    e.preventDefault();
    e.stopPropagation();
    if (!dragTeam.current || dragTeam.current.id === targetId) return;
    const next = [...teamOrder];
    const from = next.indexOf(dragTeam.current.id);
    const to = next.indexOf(targetId);
    if (from !== -1 && to !== -1) {
      next.splice(from, 1);
      next.splice(to, 0, dragTeam.current.id);
      onTeamReorder(next);
    }
    dragTeam.current = null;
    setDragOverTeam(null);
  }
  function onTeamDragEnd() {
    dragTeam.current = null;
    setDragOverTeam(null);
  }

  return (
    <div className="team-strip">
      {Object.entries(grouped).map(([league, leagueTeams]) => (
        <div
          key={league}
          className={`team-strip__group${dragOverLeague === league ? ' team-strip__group--drag-over' : ''}`}
          draggable
          onDragStart={(e) => onLeagueDragStart(e, league)}
          onDragOver={(e) => onLeagueDragOver(e, league)}
          onDrop={(e) => onLeagueDrop(e, league)}
          onDragEnd={onLeagueDragEnd}
        >
          <span className="team-strip__league-label">
            <GripVertical size={11} className="team-strip__drag-icon" aria-hidden="true" />
            {league}
          </span>
          <div className="team-strip__items">
            {leagueTeams.map((team) => (
              <button
                key={team.favouriteId}
                type="button"
                draggable
                className={`team-strip__item team-strip__item--${league.toLowerCase()}${dragOverTeam === team.favouriteId ? ' team-strip__item--drag-over' : ''}`}
                onClick={() => scrollToTeam(team.favouriteId)}
                onDragStart={(e) => onTeamDragStart(e, team.favouriteId, league)}
                onDragOver={(e) => onTeamDragOver(e, team.favouriteId, league)}
                onDrop={(e) => onTeamDrop(e, team.favouriteId)}
                onDragEnd={onTeamDragEnd}
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
  const { leagueOrder, setLeagueOrder, teamOrder, setTeamOrder } = useTheme();
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

  // Keep teamOrder in sync with loaded teams: preserve saved order, append new, drop removed
  useEffect(() => {
    if (!teams.length) return;
    setTeamOrder(prev => {
      const loadedIds = teams.map(t => t.favouriteId);
      const merged = [
        ...prev.filter(id => loadedIds.includes(id)),
        ...loadedIds.filter(id => !prev.includes(id)),
      ];
      const unchanged = merged.length === prev.length && merged.every((id, i) => id === prev[i]);
      return unchanged ? prev : merged;
    });
  }, [teams, setTeamOrder]);

  const sortedTeams = useMemo(() => {
    if (!teamOrder.length) return teams;
    return [...teams].sort((a, b) => {
      const ai = teamOrder.indexOf(a.favouriteId);
      const bi = teamOrder.indexOf(b.favouriteId);
      return (ai === -1 ? 9999 : ai) - (bi === -1 ? 9999 : bi);
    });
  }, [teams, teamOrder]);

  const sortedLeagueOverviews = useMemo(() => (
    [...leagueOverviews].sort((a, b) => {
      const ai = leagueOrder.indexOf(a.league);
      const bi = leagueOrder.indexOf(b.league);
      return (ai === -1 ? 9999 : ai) - (bi === -1 ? 9999 : bi);
    })
  ), [leagueOverviews, leagueOrder]);

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
      {sortedTeams.length > 0 && (
        <TeamLogoStrip
          teams={sortedTeams}
          leagueOrder={leagueOrder}
          teamOrder={teamOrder}
          onLeagueReorder={setLeagueOrder}
          onTeamReorder={setTeamOrder}
        />
      )}
      <GamesFeed teams={sortedTeams} />
      {sortedTeams.length > 0 && (
        <ErrorBoundary>
          <div className="team-card-grid">
            {sortedTeams.map((team) => (
              <div id={`team-${team.favouriteId}`} key={team.favouriteId}>
                <TeamCard team={team} />
              </div>
            ))}
          </div>
        </ErrorBoundary>
      )}
      {sortedLeagueOverviews.length > 0 && (
        <ErrorBoundary>
          <div className="league-card-grid">
            {sortedLeagueOverviews.map((overview) => (
              <LeagueCard key={overview.league} {...overview} />
            ))}
          </div>
        </ErrorBoundary>
      )}
    </PageContainer>
  );
}

export default HomePage;
