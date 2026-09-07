import { CalendarClock } from 'lucide-react';
import { FixtureRow } from './GamesFeed';
import { nextFixturePerSport } from './NextMatches.helpers';

function NextMatches({ teams, leagueOrder }) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const nextMatches = nextFixturePerSport(teams, leagueOrder, todayStr);

  if (nextMatches.length === 0) return null;

  return (
    <section className="games-feed">
      <h2 className="games-feed__title">
        <CalendarClock size={16} strokeWidth={2} />
        Next Matches
      </h2>
      <ul className="games-feed__list">
        {nextMatches.map((team) => <FixtureRow key={team.favouriteId} team={team} />)}
      </ul>
    </section>
  );
}

export default NextMatches;
