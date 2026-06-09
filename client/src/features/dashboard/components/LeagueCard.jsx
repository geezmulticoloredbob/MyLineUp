import { CalendarDays, ClipboardList, Trophy } from 'lucide-react';

function LeagueSportIcon({ league }) {
  if (league === 'NBA') {
    return (
      <svg className="league-card__sport-icon" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10 1v18M1 10h18" stroke="currentColor" strokeWidth="1.5" />
        <path d="M4 3.5C6.5 6 7.5 8 7.5 10s-1 4-3.5 6.5" stroke="currentColor" strokeWidth="1.2" fill="none" />
        <path d="M16 3.5C13.5 6 12.5 8 12.5 10s1 4 3.5 6.5" stroke="currentColor" strokeWidth="1.2" fill="none" />
      </svg>
    );
  }
  if (league === 'EPL') {
    return (
      <svg className="league-card__sport-icon" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" />
        <polygon points="10,6 11.5,9 15,9 12.5,11 13.5,14.5 10,12.5 6.5,14.5 7.5,11 5,9 8.5,9" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinejoin="round" />
      </svg>
    );
  }
  if (league === 'AFL') {
    return (
      <svg className="league-card__sport-icon" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <ellipse cx="10" cy="10" rx="4" ry="9" stroke="currentColor" strokeWidth="1.5" />
        <path d="M1.5 10h17M3 5.5C5.5 7 7 8.4 7 10s-1.5 3-3.5 4.5M17 5.5C14.5 7 13 8.4 13 10s1.5 3 3.5 4.5" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    );
  }
  return null;
}

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

const STANDINGS_STATS = {
  NBA: ['wins', 'losses'],
  EPL: ['played', 'points', 'gd'],
  AFL: ['wins', 'losses', 'percentage'],
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

function StandingsSection({ league, standings, seasonComplete }) {
  const keys = STANDINGS_STATS[league] || [];
  const rows = (standings || []).slice(0, 5);

  return (
    <div className="lc-section">
      <h3 className="lc-section__title">
        <Trophy size={13} strokeWidth={2} /> Standings
      </h3>
      {!standings ? (
        <p className="lc-empty">Unavailable</p>
      ) : (
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
                  {row.logoUrl && <img src={row.logoUrl} alt="" width={16} height={16} className="lc-table__logo" />}
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
        <LeagueSportIcon league={league} />
        <h2 className="league-card__title">{league}</h2>
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
