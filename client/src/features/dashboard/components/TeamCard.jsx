import { formatStatLabel, resolvePriorityPanel } from '../utils/priority';

function CardHeader({ teamName, league, logoUrl, ladderPosition }) {
  return (
    <header className="team-card__header">
      <img
        className="team-card__logo"
        src={logoUrl || 'https://via.placeholder.com/48?text=TEAM'}
        alt={`${teamName} logo`}
        width={48}
        height={48}
      />
      <div>
        <h2 className="team-card__title">{teamName}</h2>
        <p className="team-card__meta">
          {league} | Ladder #{ladderPosition ?? '-'}
        </p>
      </div>
    </header>
  );
}

function PriorityPanel({ team }) {
  const panel = resolvePriorityPanel(team);

  return (
    <section className="team-card__section">
      <h3 className="team-card__section-title">{panel.title}</h3>
      <p>{panel.content}</p>
      <p className="team-card__meta">{panel.meta}</p>
    </section>
  );
}

function StatsPanel({ stats }) {
  const entries = Object.entries(stats || {});

  if (!entries.length) {
    return (
      <section className="team-card__section">
        <h3 className="team-card__section-title">Basic Stats</h3>
        <p className="team-card__meta">No stats available yet.</p>
      </section>
    );
  }

  return (
    <section className="team-card__section">
      <h3 className="team-card__section-title">Basic Stats</h3>
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

function TeamCard({ team, status = 'ready', errorMessage = '' }) {
  if (status === 'loading') {
    return <article className="team-card team-card--state">Loading team card...</article>;
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
      <CardHeader
        teamName={team.teamName || 'Unknown Team'}
        league={team.league || 'League'}
        logoUrl={team.logoUrl}
        ladderPosition={team.ladderPosition}
      />
      <PriorityPanel team={team} />
      <StatsPanel stats={team.stats} />
    </article>
  );
}

export default TeamCard;
