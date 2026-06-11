import { CalendarDays, ClipboardList, Trophy } from 'lucide-react';

function LeagueSportIcon({ league }) {
  if (league === 'NBA') {
    return (
      <svg className="league-card__sport-icon" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
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
      <svg className="league-card__sport-icon" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle cx="10" cy="10" r="9" fill="#f0f0f0" />
        <polygon points="10,6.8 12.1,8.4 11.3,10.9 8.7,10.9 7.9,8.4" fill="#111" />
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
      <svg className="league-card__sport-icon" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <ellipse cx="10" cy="10" rx="5.5" ry="9" fill="#8B2500" />
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
