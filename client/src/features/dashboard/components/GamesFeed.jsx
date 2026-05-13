import { CalendarDays } from 'lucide-react';

function getDateLabel(date) {
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  return date.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
}

function groupByDate(teams) {
  const map = new Map();
  for (const team of teams) {
    const date = new Date(team.nextFixture.date);
    const key = date.toDateString();
    if (!map.has(key)) map.set(key, { label: getDateLabel(date), teams: [] });
    map.get(key).teams.push(team);
  }
  return [...map.values()];
}

function GamesFeed({ teams }) {
  const now = new Date();

  const upcoming = teams
    .filter((t) => t.nextFixture?.date)
    .map((t) => ({ team: t, date: new Date(t.nextFixture.date) }))
    .filter(({ date }) => !Number.isNaN(date.getTime()) && date >= now)
    .sort((a, b) => a.date - b.date)
    .map(({ team }) => team);

  if (!upcoming.length) return null;

  const groups = groupByDate(upcoming);

  return (
    <section className="games-feed">
      <h2 className="games-feed__title">
        <CalendarDays size={16} strokeWidth={2} />
        Upcoming Games
      </h2>
      {groups.map((group) => (
        <div key={group.label} className="games-feed__group">
          <div className="games-feed__group-label">{group.label}</div>
          <ul className="games-feed__list">
            {group.teams.map((team) => (
              <li key={team.favouriteId} className="games-feed__item">
                <img
                  className="games-feed__logo"
                  src={team.teamLogoUrl || 'https://via.placeholder.com/32?text=T'}
                  alt={team.teamName}
                  width={32}
                  height={32}
                />
                <div className="games-feed__team">
                  <span className="games-feed__team-name">{team.teamName}</span>
                  <span className="games-feed__badge">{team.league}</span>
                </div>
                <div className="games-feed__opponent">
                  vs {team.nextFixture.opponent || 'TBD'}
                </div>
                <div className="games-feed__right">
                  {team.nextFixture.time && (
                    <span className="games-feed__time">{team.nextFixture.time}</span>
                  )}
                  {team.nextFixture.venue && (
                    <span className="games-feed__venue">{team.nextFixture.venue}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}

export default GamesFeed;
