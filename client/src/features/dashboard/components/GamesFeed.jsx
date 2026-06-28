import { CalendarDays } from 'lucide-react';
import { formatGameTime } from '../utils/formatGameTime';
import { formatDate } from '../utils/formatDate';
import { useTheme } from '../../../contexts/ThemeContext';
import { LEAGUE_DISPLAY_NAMES } from '../../../constants/leagues';

function getDateLabel(date, dateFormat) {
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  return formatDate(date, dateFormat);
}

function groupByDate(teams, dateFormat) {
  const map = new Map();
  for (const team of teams) {
    const date = new Date(team.nextFixture.date + 'T00:00:00');
    const key = date.toDateString();
    if (!map.has(key)) map.set(key, { label: getDateLabel(date, dateFormat), teams: [] });
    map.get(key).teams.push(team);
  }
  return [...map.values()];
}

function GamesFeed({ teams }) {
  const { dateFormat } = useTheme();
  const now = new Date();

  const upcoming = teams
    .filter((t) => t.nextFixture?.date)
    .map((t) => ({ team: t, date: new Date(t.nextFixture.date) }))
    .filter(({ date }) => !Number.isNaN(date.getTime()) && date >= now)
    .sort((a, b) => a.date - b.date)
    .map(({ team }) => team);

  if (!upcoming.length) return null;

  const groups = groupByDate(upcoming, dateFormat);

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
                  src={team.teamLogoUrl || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%23333'/%3E%3Ccircle cx='16' cy='12' r='5' fill='%23555'/%3E%3Cpath d='M6 28c0-5.523 4.477-10 10-10s10 4.477 10 10' fill='%23555'/%3E%3C/svg%3E"}
                  alt={team.teamName}
                  width={32}
                  height={32}
                />
                <div className="games-feed__team">
                  <span className="games-feed__team-name">{team.teamName}</span>
                  <span className="games-feed__badge">{LEAGUE_DISPLAY_NAMES[team.league] || team.league}</span>
                </div>
                <div className="games-feed__opponent">
                  <span>vs</span>
                  {team.nextFixture.opponentLogoUrl && (
                    <img
                      className="games-feed__opp-logo"
                      src={team.nextFixture.opponentLogoUrl}
                      alt=""
                      width={24}
                      height={24}
                    />
                  )}
                  <span>{team.nextFixture.opponent || 'TBD'}</span>
                </div>
                <div className="games-feed__right">
                  {(team.nextFixture.utcDate || team.nextFixture.time) && (
                    <span className="games-feed__time">
                      {formatGameTime(team.nextFixture.utcDate, team.nextFixture.venueTimezone) || team.nextFixture.time}
                    </span>
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
