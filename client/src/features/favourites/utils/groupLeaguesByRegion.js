import { LEAGUE_REGION, REGION_ORDER } from '../../../constants/leagues';

const FALLBACK_REGION = 'OTHER';

// Groups a flat league list into { region, leagues } sections, ordered by
// REGION_ORDER. A league missing from LEAGUE_REGION (e.g. a newly added one
// nobody's mapped to a region yet) falls into a trailing "Other" section
// instead of silently disappearing from the list.
function groupLeaguesByRegion(leagues) {
  const byRegion = new Map();

  for (const league of leagues || []) {
    const region = LEAGUE_REGION[league] || FALLBACK_REGION;
    if (!byRegion.has(region)) byRegion.set(region, []);
    byRegion.get(region).push(league);
  }

  const orderedRegions = [...REGION_ORDER, FALLBACK_REGION].filter((region) => byRegion.has(region));
  return orderedRegions.map((region) => ({ region, leagues: byRegion.get(region) }));
}

export { groupLeaguesByRegion, FALLBACK_REGION };
