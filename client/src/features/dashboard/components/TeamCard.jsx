import { formatStatLabel, getLatestResultPanel, getNextGamePanel } from '../utils/priority';
import { BarChart3, CalendarDays, Star, WifiOff } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import { LEAGUE_DISPLAY_NAMES, LEAGUE_SPORT } from '../../../constants/leagues';
import { teamColors } from '../../../data/teamColors';
import SportIcon from '../../../components/common/SportIcon';

const PLACEHOLDER_LOGO = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 52 52'%3E%3Crect width='52' height='52' fill='%23333'/%3E%3Ccircle cx='26' cy='20' r='8' fill='%23555'/%3E%3Cpath d='M10 44c0-8.837 7.163-16 16-16s16 7.163 16 16' fill='%23555'/%3E%3C/svg%3E";

function handleLogoError(e) {
  e.target.onerror = null;
  e.target.src = PLACEHOLDER_LOGO;
}

function ordinal(n) {
  if (n >= 11 && n <= 13) return `${n}th`;
  const rem = n % 10;
  if (rem === 1) return `${n}st`;
  if (rem === 2) return `${n}nd`;
  if (rem === 3) return `${n}rd`;
  return `${n}th`;
}

function formatRecord(stats, league) {
  if (!stats) return null;
  if (stats.won != null) {
    // Football: W-D-L
    return `${stats.won}W ${stats.drawn ?? 0}D ${stats.lost ?? 0}L`;
  }
  if (stats.wins != null && stats.losses != null) {
    // NBA, AFL: W-L
    return `${stats.wins}-${stats.losses}`;
  }
  return null;
}

function CardBanner({ teamName, league, logoUrl, darkLogoUrl, ladderPosition, stats, source, seasonFinished, isChampion }) {
  const record = formatRecord(stats, league);
  const positionLabel = ladderPosition != null
    ? seasonFinished ? `Final: ${ordinal(ladderPosition)}` : `#${ladderPosition}`
    : null;
  const recordLine = [positionLabel, record].filter(Boolean).join(' · ');

  return (
    <div className="team-card__banner">
      {!darkLogoUrl && logoUrl && (
        <img
          className="team-card__banner-bg"
          src={logoUrl}
          alt=""
          aria-hidden="true"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      )}
      <div className="team-card__banner-overlay" />
      {darkLogoUrl && (
        <img
          className="team-card__banner-dark-logo"
          src={darkLogoUrl}
          alt=""
          aria-hidden="true"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      )}
      <SportIcon sport={LEAGUE_SPORT[league]} league={league} size={20} className="team-card__sport-icon" />
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
          src={logoUrl || PLACEHOLDER_LOGO}
          alt={`${teamName} logo`}
          width={46}
          height={46}
          onError={handleLogoError}
        />
        <div className="team-card__banner-info">
          <h2 className="team-card__title" title={teamName}>{teamName}</h2>
          <p className="team-card__meta">{LEAGUE_DISPLAY_NAMES[league] || league}</p>
          {recordLine && <p className="team-card__banner-record">{recordLine}</p>}
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
            width={26}
            height={26}
            onError={(e) => { e.target.style.display = 'none'; }}
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
  // WC group position 1 ≠ tournament winner — exclude from champion detection
  const isChampion = seasonFinished && team.ladderPosition === 1 && team.league !== 'WC';

  const cardClass = [
    'team-card',
    team.league === 'WC' ? 'team-card--nation' : '',
    seasonFinished ? 'team-card--season-done' : '',
    isChampion ? 'team-card--champions' : '',
  ].filter(Boolean).join(' ');

  const colors = (team.primaryColor && team.secondaryColor)
    ? { primary: team.primaryColor, secondary: team.secondaryColor }
    : teamColors[team.teamId];
  const colorVars = colors
    ? {
        '--team-primary': colors.primary,
        '--team-secondary': colors.secondary,
        ...(colors.tertiary ? { '--team-tertiary': colors.tertiary } : {}),
      }
    : {};

  return (
    <article className={cardClass} style={colorVars}>
      <CardBanner
        teamName={team.teamName || 'Unknown Team'}
        league={team.league || 'League'}
        logoUrl={team.teamLogoUrl}
        darkLogoUrl={team.darkLogoUrl}
        ladderPosition={team.ladderPosition}
        stats={team.stats}
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
