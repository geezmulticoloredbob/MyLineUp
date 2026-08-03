import { useEffect, useMemo, useRef, useState } from 'react';
import { GripVertical } from 'lucide-react';
import { LEAGUE_SPORT, LEAGUE_DISPLAY_NAMES, SPORT_DISPLAY_NAMES } from '../constants/leagues';
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

function sportOf(league) {
  return LEAGUE_SPORT[league] || league;
}

// Unique sports in first-seen order, derived from a list of leagues (or objects
// via `getLeague`) — keeps sport/league group ordering consistent across the strip,
// the team grid, and the league-overview cards.
function uniqueSportsInOrder(items, getLeague = (x) => x) {
  const sports = [];
  items.forEach((item) => {
    const s = sportOf(getLeague(item));
    if (!sports.includes(s)) sports.push(s);
  });
  return sports;
}

// Moves every league belonging to `fromSport` as a contiguous block to sit
// where `toSport`'s leagues are, preserving order within each sport otherwise.
function moveSportBlock(leagueOrder, fromSport, toSport) {
  if (fromSport === toSport) return leagueOrder;
  const sportsInOrder = uniqueSportsInOrder(leagueOrder);
  const nextSports = [...sportsInOrder];
  nextSports.splice(nextSports.indexOf(fromSport), 1);
  nextSports.splice(nextSports.indexOf(toSport), 0, fromSport);

  const bySport = {};
  leagueOrder.forEach((l) => {
    const s = sportOf(l);
    (bySport[s] = bySport[s] || []).push(l);
  });
  return nextSports.flatMap((s) => bySport[s]);
}

function TeamLogoStrip({ teams, leagueOrder, teamOrder, onLeagueReorder, onTeamReorder }) {
  const dragSport = useRef(null);
  const dragTeam = useRef(null);
  const [dragOverSport, setDragOverSport] = useState(null);
  const [dragOverTeam, setDragOverTeam] = useState(null);

  function scrollToTeam(favouriteId) {
    document.getElementById(`team-${favouriteId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const sportsInOrder = uniqueSportsInOrder(leagueOrder);

  const grouped = sportsInOrder.reduce((acc, sport) => {
    const sportTeams = teams.filter((t) => sportOf(t.league) === sport);
    if (sportTeams.length) acc[sport] = sportTeams;
    return acc;
  }, {});

  function onSportDragStart(e, sport) {
    dragSport.current = sport;
    e.dataTransfer.effectAllowed = 'move';
  }
  function onSportDragOver(e, sport) {
    e.preventDefault();
    if (dragSport.current && dragSport.current !== sport) setDragOverSport(sport);
  }
  function onSportDrop(e, targetSport) {
    e.preventDefault();
    if (!dragSport.current || dragSport.current === targetSport) return;
    onLeagueReorder(moveSportBlock(leagueOrder, dragSport.current, targetSport));
    dragSport.current = null;
    setDragOverSport(null);
  }
  function onSportDragEnd() {
    dragSport.current = null;
    setDragOverSport(null);
  }

  function onTeamDragStart(e, teamId, sport) {
    e.stopPropagation();
    dragTeam.current = { id: teamId, sport };
    e.dataTransfer.effectAllowed = 'move';
  }
  function onTeamDragOver(e, teamId, sport) {
    e.preventDefault();
    e.stopPropagation();
    if (dragTeam.current?.id !== teamId && dragTeam.current?.sport === sport) {
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
      {Object.entries(grouped).map(([sport, sportTeams]) => (
        <div
          key={sport}
          className={`team-strip__group${dragOverSport === sport ? ' team-strip__group--drag-over' : ''}`}
          draggable
          onDragStart={(e) => onSportDragStart(e, sport)}
          onDragOver={(e) => onSportDragOver(e, sport)}
          onDrop={(e) => onSportDrop(e, sport)}
          onDragEnd={onSportDragEnd}
        >
          <span className="team-strip__league-label">
            <GripVertical size={11} className="team-strip__drag-icon" aria-hidden="true" />
            {SPORT_DISPLAY_NAMES[sport] || sport}
          </span>
          <div className="team-strip__items">
            {sportTeams.map((team) => (
              <button
                key={team.favouriteId}
                type="button"
                draggable
                className={`team-strip__item team-strip__item--${team.league.toLowerCase()}${dragOverTeam === team.favouriteId ? ' team-strip__item--drag-over' : ''}`}
                onClick={() => scrollToTeam(team.favouriteId)}
                onDragStart={(e) => onTeamDragStart(e, team.favouriteId, sport)}
                onDragOver={(e) => onTeamDragOver(e, team.favouriteId, sport)}
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

  // Cluster league cards by sport (same grouping as TeamLogoStrip) so the
  // section reads as a handful of sport groups rather than one long flat
  // list now that there are 14 leagues across 6 sports.
  const groupedLeagueOverviews = useMemo(() => {
    const sportsInOrder = uniqueSportsInOrder(sortedLeagueOverviews, (o) => o.league);
    return sportsInOrder.map((sport) => ({
      sport,
      overviews: sortedLeagueOverviews.filter((o) => sportOf(o.league) === sport),
    }));
  }, [sortedLeagueOverviews]);

  // Cluster followed teams by sport, then by league within that sport — team
  // order within a league still follows the user's drag order (teamOrder).
  const groupedTeams = useMemo(() => {
    const sportsInOrder = uniqueSportsInOrder(leagueOrder);
    return sportsInOrder
      .map((sport) => {
        const leaguesInSport = leagueOrder.filter((l) => sportOf(l) === sport);
        const leagueGroups = leaguesInSport
          .map((league) => ({ league, teams: sortedTeams.filter((t) => t.league === league) }))
          .filter((g) => g.teams.length);
        return { sport, leagueGroups };
      })
      .filter((g) => g.leagueGroups.length);
  }, [sortedTeams, leagueOrder]);

  if (status === 'loading') {
    const followedLeagues = user?.followedLeagues ?? [];
    const followedSports = [];
    followedLeagues.forEach((l) => {
      const s = sportOf(l);
      if (!followedSports.includes(s)) followedSports.push(s);
    });
    const cachedTeamCount = (() => {
      try { return JSON.parse(localStorage.getItem('mylineup_bg_teams') || '[]').length || 3; }
      catch { return 3; }
    })();
    return (
      <PageContainer title="Your Teams">
        <div className="team-card-grid">
          {Array.from({ length: cachedTeamCount }, (_, i) => <TeamCard key={i} status="loading" />)}
        </div>
        {followedLeagues.length > 0 && (
          <div className="league-groups">
            {followedSports.map((sport) => (
              <div key={sport} className="league-group">
                <h2 className="league-group__title">{SPORT_DISPLAY_NAMES[sport] || sport}</h2>
                <div className="league-card-grid">
                  {followedLeagues.filter((l) => sportOf(l) === sport).map((l) => <SkeletonLeagueCard key={l} />)}
                </div>
              </div>
            ))}
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
          <div className="team-groups">
            {groupedTeams.map(({ sport, leagueGroups }) => (
              <div key={sport} className="team-group">
                <h2 className="team-group__title">{SPORT_DISPLAY_NAMES[sport] || sport}</h2>
                {leagueGroups.map(({ league, teams: leagueTeams }) => (
                  <div key={league} className="team-subgroup">
                    <h3 className="team-subgroup__title">{LEAGUE_DISPLAY_NAMES[league] || league}</h3>
                    <div className="team-row">
                      {leagueTeams.map((team) => (
                        <div id={`team-${team.favouriteId}`} key={team.favouriteId}>
                          <TeamCard team={team} />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </ErrorBoundary>
      )}
      {sortedLeagueOverviews.length > 0 && (
        <ErrorBoundary>
          <div className="league-groups">
            {groupedLeagueOverviews.map(({ sport, overviews }) => (
              <div key={sport} className="league-group">
                <h2 className="league-group__title">{SPORT_DISPLAY_NAMES[sport] || sport}</h2>
                <div className="league-card-grid">
                  {overviews.map((overview) => (
                    <LeagueCard key={overview.league} {...overview} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ErrorBoundary>
      )}
    </PageContainer>
  );
}

export default HomePage;
