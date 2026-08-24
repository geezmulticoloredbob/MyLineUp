import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { LEAGUE_DISPLAY_NAMES, LEAGUE_ABBR, SPORT_DISPLAY_NAMES } from '../constants/leagues';
import { apiClient } from '../services/apiClient';
import { useFavouritesRefresh } from '../contexts/FavouritesContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { usePageTitle } from '../hooks/usePageTitle';
import PageContainer from '../components/common/PageContainer';
import ErrorBoundary from '../components/common/ErrorBoundary';
import SportIcon from '../components/common/SportIcon';
import TeamCard from '../features/dashboard/components/TeamCard';
import LeagueCard, { SkeletonLeagueCard } from '../features/dashboard/components/LeagueCard';
import GamesFeed from '../features/dashboard/components/GamesFeed';
import { sportOf, uniqueSportsInOrder, moveSportBlock } from './HomePage.helpers';

const LOGO_FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' fill='%23333'/%3E%3Ccircle cx='20' cy='15' r='6' fill='%23555'/%3E%3Cpath d='M8 36c0-6.627 5.373-12 12-12s12 5.373 12 12' fill='%23555'/%3E%3C/svg%3E";

function TeamLogoStrip({ teams, leagueOrder, teamOrder, onLeagueReorder, onTeamReorder, expandedSports, onToggleSport, onExpandSport }) {
  const dragSport = useRef(null);
  const dragTeam = useRef(null);
  const [dragOverSport, setDragOverSport] = useState(null);
  const [dragOverTeam, setDragOverTeam] = useState(null);

  function scrollToTeam(favouriteId, sport) {
    onExpandSport(sport);
    // The target section renders open-but-collapsed (0 height) until this commits and its
    // grid-rows transition starts — wait a frame so scrollIntoView targets the opened spot.
    requestAnimationFrame(() => {
      document.getElementById(`team-${favouriteId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  const sportsInOrder = uniqueSportsInOrder(leagueOrder);

  // Sport → league → teams, so a sport spanning several leagues (soccer) shows
  // a labelled sub-row per league instead of one undifferentiated pile of logos.
  const grouped = sportsInOrder.reduce((acc, sport) => {
    const leaguesInSport = leagueOrder.filter((l) => sportOf(l) === sport);
    const leagueGroups = leaguesInSport
      .map((league) => ({ league, teams: teams.filter((t) => t.league === league) }))
      .filter((g) => g.teams.length);
    if (leagueGroups.length) acc[sport] = leagueGroups;
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

  const sportEntries = Object.entries(grouped);

  return (
    <div className="team-strip">
      <div className="team-strip__tiles">
        {sportEntries.map(([sport, leagueGroups]) => {
          const isOpen = expandedSports.includes(sport);
          const teamCount = leagueGroups.reduce((n, g) => n + g.teams.length, 0);
          return (
            <button
              key={sport}
              type="button"
              draggable
              className={`team-strip__item team-strip__item--sport team-strip__item--sport-${sport.toLowerCase()}${isOpen ? ' team-strip__item--sport-open' : ''}${dragOverSport === sport ? ' team-strip__item--drag-over' : ''}`}
              onClick={() => onToggleSport(sport)}
              onDragStart={(e) => onSportDragStart(e, sport)}
              onDragOver={(e) => onSportDragOver(e, sport)}
              onDrop={(e) => onSportDrop(e, sport)}
              onDragEnd={onSportDragEnd}
              aria-expanded={isOpen}
              title={SPORT_DISPLAY_NAMES[sport] || sport}
            >
              {isOpen ? <ChevronDown size={12} className="team-strip__sport-chevron" /> : <ChevronRight size={12} className="team-strip__sport-chevron" />}
              <SportIcon sport={sport} size={40} className="team-strip__logo" />
              <span className="team-strip__name">{SPORT_DISPLAY_NAMES[sport] || sport}</span>
              <span className="team-strip__count">{teamCount}</span>
            </button>
          );
        })}
      </div>
      {sportEntries.map(([sport, leagueGroups]) => {
        const isOpen = expandedSports.includes(sport);
        return (
          <div key={sport} className={`team-strip__body${isOpen ? ' team-strip__body--open' : ''}`}>
            <div className="team-strip__body-inner">
              {leagueGroups.map(({ league, teams: leagueTeams }) => (
                <div key={league} className="team-strip__league-group">
                  {leagueGroups.length > 1 && (
                    <span className="team-strip__sub-label">{LEAGUE_ABBR[league] || league}</span>
                  )}
                  <div className="team-strip__items">
                    {leagueTeams.map((team) => (
                      <button
                        key={team.favouriteId}
                        type="button"
                        draggable
                        className={`team-strip__item team-strip__item--${team.league.toLowerCase()}${dragOverTeam === team.favouriteId ? ' team-strip__item--drag-over' : ''}`}
                        onClick={() => scrollToTeam(team.favouriteId, sport)}
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
          </div>
        );
      })}
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
  const { leagueOrder, setLeagueOrder, teamOrder, setTeamOrder, expandedSports, toggleSportExpand, expandSport } = useTheme();
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
      <PageContainer title="Your Lineup">
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
      <PageContainer title="Your Lineup">
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
      <PageContainer title="Your Lineup">
        <EmptyState onOpen={openManager} />
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Your Lineup">
      {sortedTeams.length > 0 && (
        <TeamLogoStrip
          teams={sortedTeams}
          leagueOrder={leagueOrder}
          teamOrder={teamOrder}
          onLeagueReorder={setLeagueOrder}
          onTeamReorder={setTeamOrder}
          expandedSports={expandedSports}
          onToggleSport={toggleSportExpand}
          onExpandSport={expandSport}
        />
      )}
      <GamesFeed teams={sortedTeams} />
      {sortedTeams.length > 0 && (
        <ErrorBoundary>
          <div className="team-groups">
            {groupedTeams.map(({ sport, leagueGroups }) => {
              const isOpen = expandedSports.includes(sport);
              const teamCount = leagueGroups.reduce((n, g) => n + g.teams.length, 0);
              return (
                <div key={sport} className="team-group">
                  <h2>
                    <button
                      type="button"
                      className="team-group__title"
                      onClick={() => toggleSportExpand(sport)}
                      aria-expanded={isOpen}
                    >
                      {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      {SPORT_DISPLAY_NAMES[sport] || sport}
                      <span className="team-group__count">{teamCount}</span>
                    </button>
                  </h2>
                  <div className={`team-group__body${isOpen ? ' team-group__body--open' : ''}`}>
                    <div className="team-group__body-inner">
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
                  </div>
                </div>
              );
            })}
          </div>
        </ErrorBoundary>
      )}
      {sortedLeagueOverviews.length > 0 && (
        <ErrorBoundary>
          <div className="league-groups">
            {groupedLeagueOverviews.map(({ sport, overviews }) => {
              const isOpen = expandedSports.includes(sport);
              return (
                <div key={sport} className="league-group">
                  <h2>
                    <button
                      type="button"
                      className="league-group__title"
                      onClick={() => toggleSportExpand(sport)}
                      aria-expanded={isOpen}
                    >
                      {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      {SPORT_DISPLAY_NAMES[sport] || sport}
                      <span className="league-group__count">{overviews.length}</span>
                    </button>
                  </h2>
                  <div className={`league-group__body${isOpen ? ' league-group__body--open' : ''}`}>
                    <div className="league-group__body-inner">
                      <div className="league-card-grid">
                        {overviews.map((overview) => (
                          <LeagueCard key={overview.league} {...overview} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ErrorBoundary>
      )}
    </PageContainer>
  );
}

export default HomePage;
