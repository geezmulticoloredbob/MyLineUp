import { Trophy } from 'lucide-react';

const STAT_KEYS = {
  NBA: ['wins', 'losses'],
  EPL: ['played', 'won', 'drawn', 'lost', 'points', 'gd'],
  AFL: ['wins', 'losses', 'points', 'percentage'],
};

const STAT_LABELS = {
  wins: 'W', losses: 'L', played: 'P', won: 'W', drawn: 'D', lost: 'L',
  points: 'Pts', gd: 'GD', percentage: '%',
};

function LeagueCard({ league, standings }) {
  if (!standings) {
    return (
      <article className="league-card league-card--unavailable">
        <header className="league-card__header">
          <Trophy size={16} strokeWidth={2} />
          <h2 className="league-card__title">{league} Standings</h2>
        </header>
        <p className="team-card__meta">Standings unavailable right now.</p>
      </article>
    );
  }

  const keys = STAT_KEYS[league] || [];
  const rows = standings.slice(0, 10);

  return (
    <article className="league-card">
      <header className="league-card__header">
        <Trophy size={16} strokeWidth={2} />
        <h2 className="league-card__title">{league} Standings</h2>
      </header>

      <div className="league-table-wrapper">
        <table className="league-table">
          <thead>
            <tr>
              <th>#</th>
              <th className="league-table__team-col">Team</th>
              {keys.map((k) => (
                <th key={k}>{STAT_LABELS[k] ?? k}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.teamName}>
                <td>{row.position ?? '-'}</td>
                <td className="league-table__team-col">
                  {row.logoUrl && (
                    <img
                      src={row.logoUrl}
                      alt=""
                      width={20}
                      height={20}
                      className="league-table__logo"
                    />
                  )}
                  {row.teamName}
                </td>
                {keys.map((k) => (
                  <td key={k}>{row.stats?.[k] ?? '-'}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}

export default LeagueCard;
