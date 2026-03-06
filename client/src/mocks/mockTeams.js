import { LEAGUES } from '../constants/leagues';

export const mockTeams = [
  {
    id: 'nba-bos',
    league: LEAGUES.NBA,
    teamName: 'Boston Celtics',
    logoUrl: 'https://via.placeholder.com/48?text=BOS',
    latestResult: {
      opponent: 'Miami Heat',
      score: '112-104',
      outcome: 'W',
      date: '2026-03-04',
    },
    nextFixture: {
      opponent: 'Milwaukee Bucks',
      venue: 'TD Garden',
      date: '2026-03-08',
      time: '7:30 PM',
    },
    ladderPosition: 2,
    stats: {
      wins: 41,
      losses: 19,
      pointsFor: 118.2,
      pointsAgainst: 110.5,
    },
    priority: 'latest',
  },
  {
    id: 'epl-ars',
    league: LEAGUES.EPL,
    teamName: 'Arsenal',
    logoUrl: 'https://via.placeholder.com/48?text=ARS',
    latestResult: {
      opponent: 'Brighton',
      score: '2-1',
      outcome: 'W',
      date: '2026-03-03',
    },
    nextFixture: {
      opponent: 'Liverpool',
      venue: 'Anfield',
      date: '2026-03-09',
      time: '8:00 PM',
    },
    ladderPosition: 3,
    stats: {
      wins: 18,
      draws: 7,
      losses: 4,
      goalDifference: 27,
    },
    priority: 'upNext',
  },
  {
    id: 'afl-coll',
    league: LEAGUES.AFL,
    teamName: 'Collingwood',
    logoUrl: 'https://via.placeholder.com/48?text=COL',
    latestResult: {
      opponent: 'Carlton',
      score: '91-78',
      outcome: 'W',
      date: '2026-03-01',
    },
    nextFixture: {
      opponent: 'Melbourne',
      venue: 'MCG',
      date: '2026-03-10',
      time: '4:10 PM',
    },
    ladderPosition: 4,
    stats: {
      wins: 2,
      losses: 1,
      pointsFor: 279,
      pointsAgainst: 255,
    },
    priority: 'upNext',
  },
];

