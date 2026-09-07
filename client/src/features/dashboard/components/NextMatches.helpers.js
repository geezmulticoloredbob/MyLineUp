import { sportOf, uniqueSportsInOrder } from '../../../pages/HomePage.helpers';

// One row per sport — whichever followed team in that sport has the
// soonest upcoming fixture, strictly after today (today's games belong in
// GamesFeed's Today view, not duplicated here).
export function nextFixturePerSport(teams, leagueOrder, todayStr) {
  const bestBySport = new Map();

  for (const team of teams) {
    if (!team.nextFixture?.date || team.nextFixture.date <= todayStr) continue;
    const sport = sportOf(team.league);
    const current = bestBySport.get(sport);
    if (!current) {
      bestBySport.set(sport, team);
      continue;
    }
    const currentKey = current.nextFixture.utcDate || current.nextFixture.date;
    const teamKey = team.nextFixture.utcDate || team.nextFixture.date;
    if (teamKey < currentKey) bestBySport.set(sport, team);
  }

  return uniqueSportsInOrder(leagueOrder)
    .filter((sport) => bestBySport.has(sport))
    .map((sport) => bestBySport.get(sport));
}
