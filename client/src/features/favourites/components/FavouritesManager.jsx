import { useState } from 'react';
import { X } from 'lucide-react';
import { LEAGUES, SUPPORTED_LEAGUES } from '../../../constants/leagues';
import { teamsByLeague } from '../../../data/teamsByLeague';
import { useFavourites } from '../hooks/useFavourites';

function FavouritesManager({ onClose }) {
  const [activeLeague, setActiveLeague] = useState(LEAGUES.NBA);
  const [busy, setBusy] = useState({});
  const { favourites, loading, addFavourite, removeFavourite } = useFavourites();

  const teams = teamsByLeague[activeLeague] ?? [];

  function getExisting(teamId) {
    return favourites.find((f) => f.teamId === teamId && f.league === activeLeague);
  }

  async function handleToggle(team) {
    const existing = getExisting(team.teamId);
    setBusy((prev) => ({ ...prev, [team.teamId]: true }));
    try {
      if (existing) {
        await removeFavourite(existing._id);
      } else {
        await addFavourite({
          league: activeLeague,
          teamId: team.teamId,
          teamName: team.teamName,
        });
      }
    } finally {
      setBusy((prev) => ({ ...prev, [team.teamId]: false }));
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
          {SUPPORTED_LEAGUES.map((league) => (
            <button
              key={league}
              type="button"
              className={`league-tab${activeLeague === league ? ' league-tab--active' : ''}`}
              onClick={() => setActiveLeague(league)}
            >
              {league}
            </button>
          ))}
        </div>

        {loading ? (
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
                    onClick={() => handleToggle(team)}
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
