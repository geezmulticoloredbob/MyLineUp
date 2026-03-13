function buildMockTeamCard(favourite) {
  return {
    favouriteId: favourite._id,
    teamId: favourite.teamId,
    teamName: favourite.teamName,
    teamLogoUrl: favourite.teamLogoUrl,
    league: favourite.league,
    latestResult: null,
    nextFixture: null,
    ladderPosition: null,
    stats: {},
    source: 'mock-placeholder',
  };
}

async function hydrateFavouriteTeams(favourites) {
  return favourites.map((favourite) => buildMockTeamCard(favourite));
}

module.exports = {
  hydrateFavouriteTeams,
};
