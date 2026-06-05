import { formatStatLabel, getLatestResultPanel, getNextGamePanel } from '../utils/priority';
import { BarChart3, CalendarDays, WifiOff } from 'lucide-react';

function CardBanner({ teamName, league, logoUrl, ladderPosition, source }) {
  return (
    <div className="team-card__banner">
      {logoUrl && (
        <img className="team-card__banner-bg" src={logoUrl} alt="" aria-hidden="true" />
      )}
      <div className="team-card__banner-overlay" />
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
