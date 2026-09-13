const Favourite = require('../models/Favourite');
const TeamSnapshot = require('../models/TeamSnapshot');
const { hydrateFavouriteTeams } = require('./sportsDataService');

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

// Distinct (league, teamId) pairs across every user's favourites — we only
// ever snapshot teams someone actually follows, not every team in every
// league, to keep this light on the rate-limited external APIs it calls
// through hydrateFavouriteTeams.
async function getDistinctFollowedTeams() {
  const rows = await Favourite.aggregate([
    {
      $group: {
        _id: { league: '$league', teamId: '$teamId' },
        teamName: { $first: '$teamName' },
        teamLogoUrl: { $first: '$teamLogoUrl' },
      },
    },
  ]);

  return rows.map((row) => ({
    league: row._id.league,
    teamId: row._id.teamId,
    teamName: row.teamName,
    teamLogoUrl: row.teamLogoUrl,
  }));
}

// Hydrates every distinct followed team through the same path the live
// dashboard uses, then upserts one row per team for today — safe to run
// more than once a day (it just overwrites today's row rather than
// duplicating it).
async function captureSnapshots() {
  const distinctTeams = await getDistinctFollowedTeams();
  const hydrated = await hydrateFavouriteTeams(distinctTeams);
  const capturedOn = todayKey();

  let captured = 0;
  let skipped = 0;

  for (const team of hydrated) {
    if (!team.dataAvailable) {
      skipped += 1;
      continue;
    }

    await TeamSnapshot.findOneAndUpdate(
      { league: team.league, teamId: team.teamId, capturedOn },
      {
        league: team.league,
        teamId: team.teamId,
        teamName: team.teamName,
        capturedOn,
        latestResult: team.latestResult,
        ladderPosition: team.ladderPosition,
        stats: team.stats,
      },
      { upsert: true, setDefaultsOnInsert: true }
    );
    captured += 1;
  }

  return { teamsConsidered: distinctTeams.length, captured, skipped };
}

// Snapshot history for one team, oldest first — the raw material for a
// future trend/form feature (win streaks, ladder movement over time, etc).
async function getTeamHistory(league, teamId, { limit = 30 } = {}) {
  const snapshots = await TeamSnapshot.find({ league, teamId })
    .sort({ capturedOn: -1 })
    .limit(limit);

  return snapshots.reverse();
}

module.exports = { captureSnapshots, getTeamHistory };
