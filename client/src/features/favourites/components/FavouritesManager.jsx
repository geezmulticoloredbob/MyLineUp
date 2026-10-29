import { useState, useEffect, useRef, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { SUPPORTED_LEAGUES, LEAGUE_DISPLAY_NAMES, REGION_DISPLAY_NAMES } from '../../../constants/leagues';
import { teamsByLeague } from '../../../data/teamsByLeague';
import { groupLeaguesByRegion } from '../utils/groupLeaguesByRegion';
import { useFavourites } from '../hooks/useFavourites';
import { useAuth } from '../../../contexts/AuthContext';
import { PLAYER_PAGES_LEAGUES } from '../../players/constants';
import { usePlayerFavourites } from '../../players/hooks/usePlayerFavourites';
import { useRoster } from '../../players/hooks/useRoster';

import { updateFollowedLeagues } from '../../../services/leagueApi';

const TAB_LEAGUES = 'LEAGUES';

function PlayersPanel({ league, playerFavourites, onToggle, busy }) {
  const teams = teamsByLeague[league] ?? [];
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const selectedTeam = teams.find((t) => t.teamId === selectedTeamId) || null;
  const { roster, status } = useRoster(league, selectedTeam);

  function getExisting(playerId) {
    return playerFavourites.find((f) => f.playerId === playerId && f.league === league);
  }

  return (
    <div className="players-panel">
      <h3 className="players-panel__title">Players</h3>
      <select
        className="players-panel__team-select"
        value={selectedTeamId}
        onChange={(e) => setSelectedTeamId(e.target.value)}
      >
        <option value="">Choose a team to see its roster…</option>
        {teams.map((team) => (
          <option key={team.teamId} value={team.teamId}>{team.teamName}</option>
        ))}
      </select>

      {status === 'loading' && <p className="modal__status">Loading roster...</p>}
      {status === 'error' && <p className="modal__error" role="alert">Could not load this team's roster.</p>}

      {status === 'ready' && (
        <ul className="team-list">
          {roster.map((player) => {
            const existing = getExisting(player.id);
            const isBusy = Boolean(busy[player.id]);
            return (
              <li key={player.id} className="team-list__item">
                <div>
                  <span className="team-list__name">{player.name}</span>
                  {player.position && <p className="team-list__sub">{player.position}</p>}
                </div>
                <button
                  type="button"
                  className={`btn-toggle${existing ? ' btn-toggle--active' : ''}`}
                  disabled={isBusy}
                  onClick={() => onToggle(player, selectedTeam)}
                >
                  {isBusy ? '...' : existing ? 'Remove' : 'Add'}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function LeaguesPanel({ followedLeagues, onToggle, busy }) {
  const regionGroups = groupLeaguesByRegion(SUPPORTED_LEAGUES);

  return (
    <ul className="team-list">
      {regionGroups.map(({ region, leagues }) => (
        <li key={region} className="team-list__region">
          <span className="team-list__region-header">{REGION_DISPLAY_NAMES[region] || 'Other'}</span>
          <ul className="team-list__region-items">
            {leagues.map((league) => {
              const isFollowing = followedLeagues.includes(league);
              const isBusy = Boolean(busy[league]);
              return (
                <li key={league} className="team-list__item">
                  <div>
                    <span className="team-list__name">{LEAGUE_DISPLAY_NAMES[league] || league}</span>
                    <p className="team-list__sub">Show {LEAGUE_DISPLAY_NAMES[league] || league} standings &amp; fixtures on your dashboard</p>
                  </div>
                  <button
                    type="button"
                    className={`btn-toggle${isFollowing ? ' btn-toggle--active' : ''}`}
                    onClick={() => onToggle(league)}
                    disabled={isBusy}
                  >
                    {isBusy ? '...' : isFollowing ? 'Unfollow' : 'Follow'}
                  </button>
                </li>
              );
            })}
          </ul>
        </li>
      ))}
    </ul>
  );
}

const SUB_TAB_TEAMS = 'TEAMS';
const SUB_TAB_PLAYERS = 'PLAYERS';

function FavouritesManager({ onClose }) {
  const [activeTab, setActiveTab] = useState(TAB_LEAGUES);
  const [leagueSubTab, setLeagueSubTab] = useState(SUB_TAB_TEAMS);
  const [busy, setBusy] = useState({});
  const [playerBusy, setPlayerBusy] = useState({});
  const [leagueBusy, setLeagueBusy] = useState({});
  const [error, setError] = useState(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const dirtyRef = useRef(false);
  const tabsRef = useRef(null);

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose(dirtyRef.current);
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const updateScrollState = useCallback(() => {
    const el = tabsRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    updateScrollState();
    const el = tabsRef.current;
    if (!el) return;
    const onResize = () => updateScrollState();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [updateScrollState]);

  function scrollTabs(direction) {
    const el = tabsRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.6, behavior: 'smooth' });
  }
  const { favourites, loading, addFavourite, removeFavourite } = useFavourites();
  const { playerFavourites, addPlayerFavourite, removePlayerFavourite } = usePlayerFavourites();
  const { user, updateUser } = useAuth();

  useEffect(() => {
    setLeagueSubTab(SUB_TAB_TEAMS);
  }, [activeTab]);

  const followedLeagues = user?.followedLeagues ?? [];
  const teams = teamsByLeague[activeTab] ?? [];
  const showPlayersSubTab = PLAYER_PAGES_LEAGUES.includes(activeTab);

  function getExisting(teamId) {
    return favourites.find((f) => f.teamId === teamId && f.league === activeTab);
  }

  async function handleTeamToggle(team) {
    const existing = getExisting(team.teamId);
    setBusy((prev) => ({ ...prev, [team.teamId]: true }));
    setError(null);
    try {
      if (existing) {
        await removeFavourite(existing._id);
      } else {
        await addFavourite({ league: activeTab, teamId: team.teamId, teamName: team.teamName });
      }
      dirtyRef.current = true;
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setBusy((prev) => ({ ...prev, [team.teamId]: false }));
    }
  }

  async function handlePlayerToggle(player, team) {
    const existing = playerFavourites.find((f) => f.playerId === player.id && f.league === activeTab);
    setPlayerBusy((prev) => ({ ...prev, [player.id]: true }));
    setError(null);
    try {
      if (existing) {
        await removePlayerFavourite(existing._id);
      } else {
        await addPlayerFavourite({
          league: activeTab,
          playerId: player.id,
          playerName: player.name,
          teamId: team.teamId,
          teamName: team.teamName,
          position: player.position,
          headshotUrl: player.headshotUrl,
        });
      }
      dirtyRef.current = true;
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setPlayerBusy((prev) => ({ ...prev, [player.id]: false }));
    }
  }

  async function handleLeagueToggle(league) {
    const next = followedLeagues.includes(league)
      ? followedLeagues.filter((l) => l !== league)
      : [...followedLeagues, league];
    setLeagueBusy((prev) => ({ ...prev, [league]: true }));
    setError(null);
    try {
      await updateFollowedLeagues(next);
      updateUser({ followedLeagues: next });
      dirtyRef.current = true;
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLeagueBusy((prev) => ({ ...prev, [league]: false }));
    }
  }

  return (
    <div className="modal-overlay" onClick={() => onClose(dirtyRef.current)} aria-label="Close modal">
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal__header">
          <h2 className="modal__title" id="modal-title">Manage Favourites</h2>
          <button className="modal__close" type="button" onClick={() => onClose(dirtyRef.current)} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {error && <p className="modal__error" role="alert">{error}</p>}

        <div className="league-tabs-row">
          <button
            type="button"
            className="league-tabs-arrow"
            onClick={() => scrollTabs(-1)}
            disabled={!canScrollLeft}
            aria-label="Scroll leagues left"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="league-tabs" ref={tabsRef} onScroll={updateScrollState}>
            <button
              type="button"
              className={`league-tab${activeTab === TAB_LEAGUES ? ' league-tab--active' : ''}`}
              onClick={() => setActiveTab(TAB_LEAGUES)}
            >
              Leagues
            </button>
            {SUPPORTED_LEAGUES.map((league) => (
              <button
                key={league}
                type="button"
                className={`league-tab${activeTab === league ? ' league-tab--active' : ''}`}
                onClick={() => setActiveTab(league)}
              >
                {LEAGUE_DISPLAY_NAMES[league] || league}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="league-tabs-arrow"
            onClick={() => scrollTabs(1)}
            disabled={!canScrollRight}
            aria-label="Scroll leagues right"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {activeTab === TAB_LEAGUES ? (
          <LeaguesPanel
            followedLeagues={followedLeagues}
            onToggle={handleLeagueToggle}
            busy={leagueBusy}
          />
        ) : loading ? (
          <p className="modal__status">Loading favourites...</p>
        ) : (
          <>
            {showPlayersSubTab && (
              <div className="league-sub-tabs">
                <button
                  type="button"
                  className={`league-sub-tab${leagueSubTab === SUB_TAB_TEAMS ? ' league-sub-tab--active' : ''}`}
                  onClick={() => setLeagueSubTab(SUB_TAB_TEAMS)}
                >
                  Teams
                </button>
                <button
                  type="button"
                  className={`league-sub-tab${leagueSubTab === SUB_TAB_PLAYERS ? ' league-sub-tab--active' : ''}`}
                  onClick={() => setLeagueSubTab(SUB_TAB_PLAYERS)}
                >
                  Players
                </button>
              </div>
            )}
            {leagueSubTab === SUB_TAB_PLAYERS && showPlayersSubTab ? (
              <PlayersPanel
                league={activeTab}
                playerFavourites={playerFavourites}
                onToggle={handlePlayerToggle}
                busy={playerBusy}
              />
            ) : (
              <ul className="team-list">
                {teams.map((team) => {
                  const isFav = Boolean(getExisting(team.teamId));
                  const isBusy = Boolean(busy[team.teamId]);
                  return (
                    <li key={team.teamId} className="team-list__item">
                      <span className="team-list__name">{team.teamName}</span>
                      <button
                        type="button"
                        className={`btn-toggle${isFav ? ' btn-toggle--active' : ''}`}
                        onClick={() => handleTeamToggle(team)}
                        disabled={isBusy}
                      >
                        {isBusy ? '...' : isFav ? 'Remove' : 'Add'}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default FavouritesManager;
