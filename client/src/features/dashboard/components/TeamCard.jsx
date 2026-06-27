import { formatStatLabel, getLatestResultPanel, getNextGamePanel } from '../utils/priority';
import { BarChart3, CalendarDays, Star, WifiOff } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';

function SportIcon({ league }) {
  if (league === 'NBA') {
    return (
      <svg className="team-card__sport-icon" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        {/* Orange basketball with seam lines */}
        <circle cx="10" cy="10" r="9" fill="#e87722" />
        <path d="M1 10h18M10 1v18" stroke="#7a2e00" strokeWidth="1" fill="none" />
        <path d="M6,1.94 Q2.2,10 6,18.06" stroke="#7a2e00" strokeWidth="1" fill="none" />
        <path d="M14,1.94 Q17.8,10 14,18.06" stroke="#7a2e00" strokeWidth="1" fill="none" />
        <circle cx="10" cy="10" r="9" fill="none" stroke="#7a2e00" strokeWidth="0.8" />
      </svg>
    );
  }
  if (league === 'EPL') {
    return (
      <svg className="team-card__sport-icon" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        {/* White soccer ball with classic black pentagon patches */}
        <circle cx="10" cy="10" r="9" fill="#f0f0f0" />
        {/* Centre pentagon */}
        <polygon points="10,6.8 12.1,8.4 11.3,10.9 8.7,10.9 7.9,8.4" fill="#111" />
        {/* 5 outer patches at ball edge */}
        <polygon points="10,1.2 11.2,3.2 8.8,3.2" fill="#111" />
        <polygon points="17.4,6.4 15.6,7.2 15.2,5.2" fill="#111" />
        <polygon points="16.2,15.2 14.2,14.6 15.4,12.8" fill="#111" />
        <polygon points="3.8,15.2 5.8,14.6 4.6,12.8" fill="#111" />
        <polygon points="2.6,6.4 4.4,7.2 4.8,5.2" fill="#111" />
        <circle cx="10" cy="10" r="9" fill="none" stroke="#555" strokeWidth="0.8" />
      </svg>
    );
  }
  if (league === 'AFL') {
    return (
      <svg className="team-card__sport-icon" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        {/* Brown AFL Sherrin with white lace */}
        <ellipse cx="10" cy="10" rx="5.5" ry="9" fill="#8B2500" />
        {/* Lace stitching */}
        <line x1="10" y1="6" x2="10" y2="14" stroke="#fff" strokeWidth="1.2" />
        <line x1="7.8" y1="7.2" x2="12.2" y2="7.2" stroke="#fff" strokeWidth="0.8" strokeDasharray="1.2,0.8" />
        <line x1="7.4" y1="9" x2="12.6" y2="9" stroke="#fff" strokeWidth="0.8" strokeDasharray="1.2,0.8" />
        <line x1="7.4" y1="10.8" x2="12.6" y2="10.8" stroke="#fff" strokeWidth="0.8" strokeDasharray="1.2,0.8" />
        <line x1="7.8" y1="12.6" x2="12.2" y2="12.6" stroke="#fff" strokeWidth="0.8" strokeDasharray="1.2,0.8" />
        <ellipse cx="10" cy="10" rx="5.5" ry="9" fill="none" stroke="#5a1800" strokeWidth="0.8" />
      </svg>
    );
  }
  return null;
}

function ordinal(n) {
  if (n >= 11 && n <= 13) return `${n}th`;
  const rem = n % 10;
  if (rem === 1) return `${n}st`;
  if (rem === 2) return `${n}nd`;
  if (rem === 3) return `${n}rd`;
  return `${n}th`;
}

function CardBanner({ teamName, league, logoUrl, ladderPosition, source, seasonFinished, isChampion }) {
  return (
    <div className="team-card__banner">
      {logoUrl && (
        <img className="team-card__banner-bg" src={logoUrl} alt="" aria-hidden="true" />
      )}
      <div className="team-card__banner-overlay" />
      <SportIcon league={league} />
      {seasonFinished ? (
        <div className={`team-card__status-badge${isChampion ? ' team-card__status-badge--champions' : ' team-card__status-badge--finished'}`}>
          {isChampion ? '🏆 Champions' : 'Season Finished'}
        </div>
      ) : source === 'unavailable' ? (
        <div className="team-card__status-badge" title="Sports data could not be loaded">
          <WifiOff size={10} />
          No live data
        </div>
      ) : null}
      <div className="team-card__banner-content">
        <img
          className="team-card__banner-logo"
          src={logoUrl || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 52 52'%3E%3Crect width='52' height='52' fill='%23333'/%3E%3Ccircle cx='26' cy='20' r='8' fill='%23555'/%3E%3Cpath d='M10 44c0-8.837 7.163-16 16-16s16 7.163 16 16' fill='%23555'/%3E%3C/svg%3E"}
          alt={`${teamName} logo`}
          width={52}
          height={52}
        />
        <div className="team-card__banner-info">
          <h2 className="team-card__title">{teamName}</h2>
          <p className="team-card__meta">
            {league}
            {ladderPosition != null
              ? seasonFinished
                ? ` · Final: ${ordinal(ladderPosition)}`
                : ` · #${ladderPosition}`
              : ''}
          </p>
        </div>
      </div>
    </div>
  );
}

function MatchPanel({ panel, tone = 'neutral' }) {
  const toneClassName = tone === 'positive' ? 'score--positive' : tone === 'warning' ? 'score--warning' : tone === 'negative' ? 'score--negative' : '';

  return (
    <section className="team-card__section">
      <h3 className="team-card__section-title">
        <CalendarDays size={14} strokeWidth={2} />
        {panel.title}
      </h3>
      <div className="team-card__score-row">
        {panel.opponentLogoUrl && (
          <img
            src={panel.opponentLogoUrl}
            alt=""
            className="team-card__opp-logo"
            width={22}
            height={22}
          />
        )}
        <p className={`team-card__score ${toneClassName}`}>{panel.content}</p>
      </div>
      <p className="team-card__meta">{panel.meta}</p>
    </section>
  );
}

function MatchesSection({ team }) {
  const { dateFormat } = useTheme();
  // Finished seasons: show last result regardless of age; no future games exist anyway
  const resultWindowDays = team?.seasonFinished ? 365 : 30;
  const latestPanel = getLatestResultPanel(team, resultWindowDays, dateFormat);
  const nextPanel = getNextGamePanel(team, 30, dateFormat);
  const resultTone =
    team?.latestResult?.outcome === 'W'
      ? 'positive'
      : team?.latestResult?.outcome === 'D'
        ? 'warning'
        : team?.latestResult?.outcome === 'L'
          ? 'negative'
          : 'neutral';

  return (
    <>
      <MatchPanel panel={latestPanel} tone={resultTone} />
      <MatchPanel panel={nextPanel} />
    </>
  );
}

function StatsPanel({ stats }) {
  const entries = Object.entries(stats || {});

  if (!entries.length) {
    return (
      <section className="team-card__section">
        <h3 className="team-card__section-title">
          <BarChart3 size={14} strokeWidth={2} />
          Basic Stats
        </h3>
        <p className="team-card__meta">No stats available yet</p>
      </section>
    );
  }

  return (
    <section className="team-card__section">
      <h3 className="team-card__section-title">
        <BarChart3 size={14} strokeWidth={2} />
        Basic Stats
      </h3>
      <ul className="team-card__stats">
        {entries.map(([key, value]) => (
          <li key={key}>
            <span>{formatStatLabel(key)}</span>
            <strong>{value}</strong>
          </li>
        ))}
      </ul>
    </section>
  );
}

function TopScorersPanel({ scorers }) {
  if (!scorers?.length) return null;

  return (
    <section className="team-card__section">
      <h3 className="team-card__section-title">
        <Star size={14} strokeWidth={2} />
        Top Scorers
      </h3>
      <ul className="team-card__scorers">
        {scorers.map((s) => (
          <li key={s.name}>
            <span>{s.name}</span>
            <strong>{s.stat}</strong>
          </li>
        ))}
      </ul>
    </section>
  );
}

function SkeletonCard() {
  return (
    <article className="team-card team-card--skeleton">
      <div className="skeleton skeleton-banner" />
      <div className="skeleton-header">
        <div className="skeleton-text-col">
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-meta skeleton-meta--narrow" />
        </div>
      </div>
      <div className="skeleton-section">
        <div className="skeleton skeleton-label" />
        <div className="skeleton skeleton-score" />
        <div className="skeleton skeleton-sub" />
      </div>
      <div className="skeleton-section">
        <div className="skeleton skeleton-label" />
        <div className="skeleton skeleton-score skeleton-score--narrow" />
        <div className="skeleton skeleton-sub skeleton-sub--wide" />
      </div>
    </article>
  );
}

function TeamCard({ team, status = 'ready', errorMessage = '' }) {
  if (status === 'loading') {
    return <SkeletonCard />;
  }

  if (status === 'error') {
    return (
      <article className="team-card team-card--state">
        Could not load team data{errorMessage ? ` — ${errorMessage}` : ''}
      </article>
    );
  }

  if (!team || status === 'empty') {
    return <article className="team-card team-card--state">No favourite teams yet</article>;
  }

  const seasonFinished = team.seasonFinished === true;
  const isChampion = seasonFinished && team.ladderPosition === 1;

  const cardClass = [
    'team-card',
    seasonFinished ? 'team-card--season-done' : '',
    isChampion ? 'team-card--champions' : '',
  ].filter(Boolean).join(' ');

  return (
    <article className={cardClass}>
      <CardBanner
        teamName={team.teamName || 'Unknown Team'}
        league={team.league || 'League'}
        logoUrl={team.teamLogoUrl}
        ladderPosition={team.ladderPosition}
        source={team.source}
        seasonFinished={seasonFinished}
        isChampion={isChampion}
      />
      <MatchesSection team={team} />
      <TopScorersPanel scorers={team.topScorers} />
      <StatsPanel stats={team.stats} />
    </article>
  );
}

export default TeamCard;
