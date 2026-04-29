import { CalendarDays, ClipboardList, Trophy } from 'lucide-react';

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

function StandingsSection({ league, standings }) {
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
          {results.map((r, i) => (
            <li key={i} className="lc-game">
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
          {fixtures.map((f, i) => (
            <li key={i} className="lc-game">
              <span className="lc-game__date">{formatDate(f.date)}{f.time ? ` · ${f.time}` : ''}</span>
              <span className="lc-game__matchup">
                <span>{f.homeTeam}</span>
                <strong className="lc-game__score">vs</strong>
                <span>{f.awayTeam}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function LeagueCard({ league, standings, recentResults, upcomingFixtures }) {
  return (
    <article className="league-card">
      <header className="league-card__header">
        <h2 className="league-card__title">{league}</h2>
      </header>
      <div className="lc-grid">
        <StandingsSection league={league} standings={standings} />
        <ResultsSection results={recentResults} />
        <FixturesSection fixtures={upcomingFixtures} />
      </div>
    </article>
  );
}

export default LeagueCard;
