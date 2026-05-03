import { formatStatLabel, getLatestResultPanel, getNextGamePanel } from '../utils/priority';
import { BarChart3, CalendarDays, Trophy } from 'lucide-react';

function CardBanner({ teamName, league, logoUrl, ladderPosition, isLive }) {
  return (
    <div className="team-card__banner">
      {logoUrl && (
        <img className="team-card__banner-bg" src={logoUrl} alt="" aria-hidden="true" />
      )}
      <div className="team-card__banner-overlay" />
      {isLive && <span className="badge-live badge-live--corner">Live</span>}
      <div className="team-card__banner-content">
        <img
          className="team-card__banner-logo"
          src={logoUrl || 'https://via.placeholder.com/52?text=TEAM'}
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
      <p className={`team-card__score ${toneClassName}`}>{panel.content}</p>
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
      <div className="skeleton" style={{ height: '100px', margin: 'calc(-1 * var(--space-md)) calc(-1 * var(--space-md)) var(--space-md)', borderRadius: 'var(--radius-card) var(--radius-card) 0 0' }} />
      <div className="skeleton-header">
        <div style={{ flex: 1 }}>
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-meta" style={{ width: '90px' }} />
        </div>
      </div>
      <div className="skeleton-section">
        <div className="skeleton skeleton-label" />
        <div className="skeleton skeleton-score" />
        <div className="skeleton skeleton-sub" />
      </div>
      <div className="skeleton-section">
        <div className="skeleton skeleton-label" />
        <div className="skeleton skeleton-score" style={{ width: '120px' }} />
        <div className="skeleton skeleton-sub" style={{ width: '140px' }} />
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
        isLive={team.isLive}
      />
      {!team.isLive ? (
        <p className="team-card__meta">
          <Trophy size={14} strokeWidth={2} /> Matchday insights ready
        </p>
      ) : null}
      <MatchesSection team={team} />
      <StatsPanel stats={team.stats} />
    </article>
  );
}

export default TeamCard;
