import { formatStatLabel, getLatestResultPanel, getNextGamePanel } from '../utils/priority';
import { BarChart3, CalendarDays, WifiOff } from 'lucide-react';

function SportIcon({ league }) {
  if (league === 'NBA') {
    return (
      <svg className="team-card__sport-icon" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10 1v18M1 10h18" stroke="currentColor" strokeWidth="1.5" />
        <path d="M4 3.5C6.5 6 7.5 8 7.5 10s-1 4-3.5 6.5" stroke="currentColor" strokeWidth="1.2" fill="none" />
        <path d="M16 3.5C13.5 6 12.5 8 12.5 10s1 4 3.5 6.5" stroke="currentColor" strokeWidth="1.2" fill="none" />
      </svg>
    );
  }
  if (league === 'EPL') {
    return (
      <svg className="team-card__sport-icon" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" />
        <polygon points="10,6 11.5,9 15,9 12.5,11 13.5,14.5 10,12.5 6.5,14.5 7.5,11 5,9 8.5,9" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinejoin="round" />
      </svg>
    );
  }
  if (league === 'AFL') {
    return (
      <svg className="team-card__sport-icon" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <ellipse cx="10" cy="10" rx="4" ry="9" stroke="currentColor" strokeWidth="1.5" />
        <path d="M1.5 10h17M3 5.5C5.5 7 7 8.4 7 10s-1.5 3-3.5 4.5M17 5.5C14.5 7 13 8.4 13 10s1.5 3 3.5 4.5" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    );
  }
  return null;
}

function CardBanner({ teamName, league, logoUrl, ladderPosition, source }) {
  return (
    <div className="team-card__banner">
      {logoUrl && (
        <img className="team-card__banner-bg" src={logoUrl} alt="" aria-hidden="true" />
      )}
      <div className="team-card__banner-overlay" />
      <SportIcon league={league} />
      {source === 'unavailable' && (
        <div className="team-card__status-badge" title="Sports data could not be loaded">
          <WifiOff size={10} />
          No live data
        </div>
      )}
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
          <p className="team-card__meta">{league}{ladderPosition != null ? ` · #${ladderPosition}` : ''}</p>
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
  const latestPanel = getLatestResultPanel(team, 30);
  const nextPanel = getNextGamePanel(team, 30);
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
        <p className="team-card__meta">No stats available yet.</p>
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
        Could not load team data. {errorMessage || 'Please try again.'}
      </article>
    );
  }

  if (!team || status === 'empty') {
    return <article className="team-card team-card--state">No favourite teams yet.</article>;
  }

  return (
    <article className="team-card">
      <CardBanner
        teamName={team.teamName || 'Unknown Team'}
        league={team.league || 'League'}
        logoUrl={team.teamLogoUrl}
        ladderPosition={team.ladderPosition}
        source={team.source}
      />
      <MatchesSection team={team} />
      <StatsPanel stats={team.stats} />
    </article>
  );
}

export default TeamCard;
