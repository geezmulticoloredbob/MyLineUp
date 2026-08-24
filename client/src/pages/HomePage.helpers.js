import { LEAGUE_SPORT } from '../constants/leagues';

export function sportOf(league) {
  return LEAGUE_SPORT[league] || league;
}

// Unique sports in first-seen order, derived from a list of leagues (or objects
// via `getLeague`) — keeps sport/league group ordering consistent across the strip,
// the team grid, and the league-overview cards.
export function uniqueSportsInOrder(items, getLeague = (x) => x) {
  const sports = [];
  items.forEach((item) => {
    const s = sportOf(getLeague(item));
    if (!sports.includes(s)) sports.push(s);
  });
  return sports;
}

// Moves every league belonging to `fromSport` as a contiguous block to sit
// where `toSport`'s leagues are, preserving order within each sport otherwise.
export function moveSportBlock(leagueOrder, fromSport, toSport) {
  if (fromSport === toSport) return leagueOrder;
  const sportsInOrder = uniqueSportsInOrder(leagueOrder);
  const nextSports = [...sportsInOrder];
  nextSports.splice(nextSports.indexOf(fromSport), 1);
  nextSports.splice(nextSports.indexOf(toSport), 0, fromSport);

  const bySport = {};
  leagueOrder.forEach((l) => {
    const s = sportOf(l);
    (bySport[s] = bySport[s] || []).push(l);
  });
  return nextSports.flatMap((s) => bySport[s]);
}
