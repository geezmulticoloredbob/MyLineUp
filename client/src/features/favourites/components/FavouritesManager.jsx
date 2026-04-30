import { useState } from 'react';
import { X } from 'lucide-react';
import { LEAGUES, SUPPORTED_LEAGUES } from '../../../constants/leagues';
import { teamsByLeague } from '../../../data/teamsByLeague';
import { useFavourites } from '../hooks/useFavourites';
import { useAuth } from '../../../contexts/AuthContext';
import { updateFollowedLeagues } from '../../../services/leagueApi';

const TAB_LEAGUES = 'LEAGUES';

function LeaguesPanel({ followedLeagues, onToggle, busy }) {
  return (
    <ul className="team-list">
      {SUPPORTED_LEAGUES.map((league) => {
        const isFollowing = followedLeagues.includes(league);
        return (
          <li key={league} className="team-list__item">
            <div>
              <span className="team-list__name">{league}</span>
              <p className="team-list__sub">Show {league} standings &amp; fixtures on your dashboard</p>
            </div>
            <button
              type="button"
              className={`btn-toggle${isFollowing ? ' btn-toggle--active' : ''}`}
              onClick={() => onToggle(league)}
              disabled={busy}
            >
              {busy ? '...' : isFollowing ? 'Unfollow' : 'Follow'}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function FavouritesManager({ onClose }) {
  const [activeTab, setActiveTab] = useState(TAB_LEAGUES);
  const [busy, setBusy] = useState({});
  const [leagueBusy, setLeagueBusy] = useState(false);
  const { favourites, loading, addFavourite, removeFavourite } = useFavourites();
  const { user, updateUser } = useAuth();

  const followedLeagues = user?.followedLeagues ?? [];
  const teams = teamsByLeague[activeTab] ?? [];

  function getExisting(teamId) {
    return favourites.find((f) => f.teamId === teamId && f.league === activeTab);
  }

  async function handleTeamToggle(team) {
    const existing = getExisting(team.teamId);
    setBusy((prev) => ({ ...prev, [team.teamId]: true }));
    try {
      if (existing) {
        await removeFavourite(existing._id);
      } else {
        await addFavourite({ league: activeTab, teamId: team.teamId, teamName: team.teamName });
      }
    } finally {
      setBusy((prev) => ({ ...prev, [team.teamId]: false }));
    }
  }

  async function handleLeagueToggle(league) {
    const next = followedLeagues.includes(league)
      ? followedLeagues.filter((l) => l !== league)
      : [...followedLeagues, league];
    setLeagueBusy(true);
    try {
      await updateFollowedLeagues(next);
      updateUser({ followedLeagues: next });
    } finally {
      setLeagueBusy(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">Manage Favourites</h2>
          <button className="modal__close" type="button" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="league-tabs">
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
              {league}
            </button>
          ))}
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
      </div>
    </div>
  );
}

export default FavouritesManager;
