import { BarChart3, WifiOff } from 'lucide-react';
import { LEAGUE_DISPLAY_NAMES } from '../../../constants/leagues';

const PLACEHOLDER_HEADSHOT = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 52 52'%3E%3Crect width='52' height='52' fill='%23333'/%3E%3Ccircle cx='26' cy='20' r='8' fill='%23555'/%3E%3Cpath d='M10 44c0-8.837 7.163-16 16-16s16 7.163 16 16' fill='%23555'/%3E%3C/svg%3E";

function handleHeadshotError(e) {
  e.target.onerror = null;
  e.target.src = PLACEHOLDER_HEADSHOT;
}

function SkeletonCard() {
  return (
    <article className="team-card player-card team-card--skeleton">
      <div className="skeleton-header">
        <div className="skeleton skeleton-banner" style={{ width: 52, height: 52, borderRadius: '50%' }} />
        <div className="skeleton-text-col">
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-meta skeleton-meta--narrow" />
        </div>
      </div>
      <div className="skeleton-section">
        <div className="skeleton skeleton-label" />
        <div className="skeleton skeleton-score" />
      </div>
    </article>
  );
}

function PlayerCard({ player, status = 'ready' }) {
  if (status === 'loading') {
    return <SkeletonCard />;
  }

  if (!player) {
    return <article className="team-card player-card team-card--state">No favourite players yet</article>;
  }

  return (
    <article className="team-card player-card">
      <div className="player-card__header">
        <img
          className="player-card__headshot"
          src={player.headshotUrl || PLACEHOLDER_HEADSHOT}
          alt={player.playerName}
          width={52}
          height={52}
          onError={handleHeadshotError}
        />
        <div className="player-card__info">
          <h2 className="team-card__title" title={player.playerName}>{player.playerName}</h2>
          <p className="team-card__meta">
            {[player.position, player.teamName, LEAGUE_DISPLAY_NAMES[player.league] || player.league]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
      </div>

      {player.source === 'unavailable' ? (
        <div className="team-card__status-badge" title="Player stats could not be loaded">
          <WifiOff size={10} />
          No live data
        </div>
      ) : (
        <section className="team-card__section">
          <h3 className="team-card__section-title">
            <BarChart3 size={14} strokeWidth={2} />
            Season Stats
          </h3>
          {player.stats?.length ? (
            <ul className="team-card__stats">
              {player.stats.map((s) => (
                <li key={s.label}>
                  <span>{s.label}</span>
                  <strong>{s.value}</strong>
                </li>
              ))}
            </ul>
          ) : (
            <p className="team-card__meta">No stats available yet</p>
          )}
        </section>
      )}
    </article>
  );
}

export default PlayerCard;
