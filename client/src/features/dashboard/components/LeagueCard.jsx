import { useState } from 'react';
import { CalendarDays, ChevronDown, ChevronUp, ClipboardList, Trophy } from 'lucide-react';
import { LEAGUE_DISPLAY_NAMES, LEAGUE_SPORT } from '../../../constants/leagues';
import SportIcon from '../../../components/common/SportIcon';

export function SkeletonLeagueCard() {
  return (
    <article className="league-card">
      <header className="league-card__header">
        <div className="skeleton lc-skeleton-header" />
      </header>
      <div className="lc-grid">
        {[5, 3, 3].map((rowCount, i) => (
          <div key={i} className="lc-section">
            <div className="skeleton lc-skeleton-section-label" />
            {Array.from({ length: rowCount }, (_, j) => (
              <div key={j} className="skeleton lc-skeleton-row" />
            ))}
          </div>
        ))}
      </div>
    </article>
  );
}

const FOOTBALL_STATS = ['played', 'points', 'gd'];

const STANDINGS_STATS = {
  NBA: ['wins', 'losses'],
  EPL: FOOTBALL_STATS,
  AFL: ['wins', 'losses', 'percentage'],
  WC: FOOTBALL_STATS,
  LALIGA: FOOTBALL_STATS,
  BUNDESLIGA: FOOTBALL_STATS,
  SERIEA: FOOTBALL_STATS,
  LIGUE1: FOOTBALL_STATS,
  CHAMPIONSHIP: FOOTBALL_STATS,
  EREDIVISIE: FOOTBALL_STATS,
  UCL: FOOTBALL_STATS,
  NFL: ['wins', 'losses'],
  NHL: ['wins', 'losses'],
  MLB: ['wins', 'losses'],
};

const STAT_LABELS = {
  wins: 'W', losses: 'L', played: 'P', points: 'Pts', gd: 'GD', percentage: '%',
};

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
}

function getUpcomingLabel(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return dateStr;
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  return d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
}

const STANDINGS_PREVIEW_COUNT = 5;

function StandingsSection({ league, standings, seasonComplete }) {
  const [expanded, setExpanded] = useState(false);
  const keys = STANDINGS_STATS[league] || [];
  const allRows = standings || [];
  const hasMore = allRows.length > STANDINGS_PREVIEW_COUNT;
  const rows = expanded ? allRows : allRows.slice(0, STANDINGS_PREVIEW_COUNT);

  return (
    <div className="lc-section">
      <h3 className="lc-section__title">
        <Trophy size={13} strokeWidth={2} /> Standings
      </h3>
      {!standings ? (
        <p className="lc-empty">Unavailable</p>
      ) : (
        <>
          <table className="lc-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Team</th>
                {keys.map((k) => <th key={k}>{STAT_LABELS[k]}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.teamName}>
                  <td>{row.position ?? '-'}</td>
                  <td className="lc-table__team">
                    {row.logoUrl && (
                      <img
                        src={row.logoUrl}
                        alt=""
                        width={16}
                        height={16}
                        className="lc-table__logo"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    )}
                    <span>{row.teamName}</span>
                    {seasonComplete && row.position === 1 && (
                      <Trophy size={12} strokeWidth={2} className="lc-table__champion-icon" aria-label="Season champion" />
                    )}
                  </td>
                  {keys.map((k) => <td key={k}>{row.stats?.[k] ?? '-'}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
          {hasMore && (
            <button type="button" className="lc-table__toggle" onClick={() => setExpanded((v) => !v)}>
              {expanded ? (
                <>Show top {STANDINGS_PREVIEW_COUNT} <ChevronUp size={12} strokeWidth={2} /></>
              ) : (
                <>Show full table ({allRows.length}) <ChevronDown size={12} strokeWidth={2} /></>
              )}
            </button>
          )}
        </>
      )}
    </div>
  );
}

function ResultsSection({ results }) {
  return (
    <div className="lc-section">
      <h3 className="lc-section__title">
        <ClipboardList size={13} strokeWidth={2} /> Recent Results
      </h3>
      {!results?.length ? (
        <p className="lc-empty">No recent results</p>
      ) : (
        <ul className="lc-games">
          {results.map((r) => (
            <li key={`${r.date}-${r.homeTeam}-${r.awayTeam}`} className="lc-game">
              <span className="lc-game__date">{formatDate(r.date)}</span>
              <span className="lc-game__matchup">
                <span className={r.homeScore > r.awayScore ? 'lc-game__team--win' : ''}>{r.homeTeam}</span>
                <strong className="lc-game__score">{r.homeScore}–{r.awayScore}</strong>
                <span className={r.awayScore > r.homeScore ? 'lc-game__team--win' : ''}>{r.awayTeam}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FixturesSection({ fixtures }) {
  return (
    <div className="lc-section">
      <h3 className="lc-section__title">
        <CalendarDays size={13} strokeWidth={2} /> Upcoming
      </h3>
      {!fixtures?.length ? (
        <p className="lc-empty">No upcoming fixtures</p>
      ) : (
        <ul className="lc-games">
          {fixtures.map((f) => (
            <li key={`${f.date}-${f.homeTeam}-${f.awayTeam}`} className="lc-game">
              <span className="lc-game__date">{getUpcomingLabel(f.date)}</span>
              <span className="lc-game__matchup">
                <span>{f.homeTeam}</span>
                <strong className="lc-game__score">vs</strong>
                <span>{f.awayTeam}</span>
              </span>
              {(f.time || f.venue) && (
                <span className="lc-game__meta">
                  {[f.time, f.venue].filter(Boolean).join(' · ')}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function LeagueCard({ league, standings, recentResults, upcomingFixtures }) {
  const seasonComplete = !upcomingFixtures?.length && !!recentResults?.length;

  return (
    <article className={`league-card league-card--${league.toLowerCase()}`}>
      <header className="league-card__header">
        <SportIcon sport={LEAGUE_SPORT[league]} league={league} size={26} className="league-card__sport-icon" />
        <h2 className="league-card__title">{LEAGUE_DISPLAY_NAMES[league] || league}</h2>
      </header>
      <div className="lc-grid">
        <StandingsSection league={league} standings={standings} seasonComplete={seasonComplete} />
        <ResultsSection results={recentResults} />
        <FixturesSection fixtures={upcomingFixtures} />
      </div>
    </article>
  );
}

export default LeagueCard;
