import { CalendarDays } from 'lucide-react';
import { formatGameTime } from '../utils/formatGameTime';
import { LEAGUE_DISPLAY_NAMES } from '../../../constants/leagues';

const LOGO_FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%23333'/%3E%3Ccircle cx='16' cy='12' r='5' fill='%23555'/%3E%3Cpath d='M6 28c0-5.523 4.477-10 10-10s10 4.477 10 10' fill='%23555'/%3E%3C/svg%3E";

function ResultRow({ team }) {
  const { latestResult, teamLogoUrl, teamName, league } = team;
  const cls =
    latestResult.outcome === 'W' ? 'score--positive'
    : latestResult.outcome === 'D' ? 'score--warning'
    : 'score--negative';
  const label = latestResult.outcome === 'W' ? 'Win' : latestResult.outcome === 'D' ? 'Draw' : 'Loss';

  return (
    <li className="games-feed__item">
      <img className="games-feed__logo" src={teamLogoUrl || LOGO_FALLBACK} alt={teamName} width={32} height={32} />
      <div className="games-feed__team">
        <span className="games-feed__team-name">{teamName}</span>
        <span className="games-feed__badge">{LEAGUE_DISPLAY_NAMES[league] || league}</span>
      </div>
      <div className="games-feed__opponent">
        <span>vs</span>
        <span>{latestResult.opponent}</span>
      </div>
      <div className="games-feed__right">
        <span className={`games-feed__result-score ${cls}`}>{latestResult.score}</span>
        <span className={`games-feed__outcome ${cls}`}>{label}</span>
      </div>
    </li>
  );
}

export function FixtureRow({ team }) {
  const { nextFixture, teamLogoUrl, teamName, league } = team;

  return (
    <li className="games-feed__item">
      <img className="games-feed__logo" src={teamLogoUrl || LOGO_FALLBACK} alt={teamName} width={32} height={32} />
      <div className="games-feed__team">
        <span className="games-feed__team-name">{teamName}</span>
        <span className="games-feed__badge">{LEAGUE_DISPLAY_NAMES[league] || league}</span>
      </div>
      <div className="games-feed__opponent">
        <span>vs</span>
        {nextFixture.opponentLogoUrl && (
          <img className="games-feed__opp-logo" src={nextFixture.opponentLogoUrl} alt="" width={24} height={24} />
        )}
        <span>{nextFixture.opponent || 'TBD'}</span>
      </div>
      <div className="games-feed__right">
        {(nextFixture.utcDate || nextFixture.time) && (
          <span className="games-feed__time">
            {formatGameTime(nextFixture.utcDate, nextFixture.venueTimezone) || nextFixture.time}
          </span>
        )}
        {nextFixture.venue && <span className="games-feed__venue">{nextFixture.venue}</span>}
      </div>
    </li>
  );
}

// Today's results and fixtures only — see NextMatches.jsx for the
// per-sport "what's coming up" view.
function GamesFeed({ teams }) {
  const todayStr = new Date().toISOString().slice(0, 10);

  const todayResults = teams.filter((t) => t.latestResult?.date === todayStr);
  const todayFixtures = teams.filter((t) => t.nextFixture?.date === todayStr);

  if (todayResults.length === 0 && todayFixtures.length === 0) return null;

  return (
    <section className="games-feed">
      <h2 className="games-feed__title">
        <CalendarDays size={16} strokeWidth={2} />
        Today
      </h2>

      {todayResults.length > 0 && (
        <>
          {todayFixtures.length > 0 && (
            <div className="games-feed__group-label">Results</div>
          )}
          <ul className="games-feed__list">
            {todayResults.map((team) => <ResultRow key={team.favouriteId} team={team} />)}
          </ul>
        </>
      )}

      {todayFixtures.length > 0 && (
        <>
          {todayResults.length > 0 && (
            <div className="games-feed__group-label games-feed__group-label--mt">Fixtures</div>
          )}
          <ul className="games-feed__list">
            {todayFixtures.map((team) => <FixtureRow key={team.favouriteId} team={team} />)}
          </ul>
        </>
      )}
    </section>
  );
}

export default GamesFeed;
