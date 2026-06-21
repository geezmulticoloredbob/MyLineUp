import { formatGameTime } from './formatGameTime';
import { formatDate } from './formatDate';

function parseDate(dateValue) {
  if (!dateValue) {
    return null;
  }

  const s = String(dateValue);
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(s + 'T00:00:00') : new Date(s);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getLatestResultPanel(team, windowDays = 30, dateFormat = 'DD-MM-YYYY') {
  const date = parseDate(team?.latestResult?.date);

  if (!date) {
    return {
      title: 'Last Result',
      content: 'No recent result available.',
      meta: 'Date unavailable',
    };
  }

  const now = new Date();
  const diffDays = (now - date) / (1000 * 60 * 60 * 24);
  const isWithinWindow = diffDays >= 0 && diffDays <= windowDays;
  const dateStr = formatDate(team?.latestResult?.date, dateFormat);

  if (!isWithinWindow) {
    return {
      title: 'Last Result',
      content: `No result in the last ${windowDays} days.`,
      meta: dateStr,
    };
  }

  return {
    title: 'Last Result',
    content: `${team?.latestResult?.outcome || '-'} vs ${team?.latestResult?.opponent || 'TBD'} (${team?.latestResult?.score || 'TBD'})`,
    meta: dateStr,
  };
}

function getNextGamePanel(team, windowDays = 30, dateFormat = 'DD-MM-YYYY') {
  const date = parseDate(team?.nextFixture?.date);

  if (!date) {
    return {
      title: 'Next Game',
      content: 'No upcoming fixture available.',
      meta: 'Date unavailable',
    };
  }

  const now = new Date();
  const diffDays = (date - now) / (1000 * 60 * 60 * 24);
  const isWithinWindow = diffDays >= 0 && diffDays <= windowDays;
  const dateStr = formatDate(team?.nextFixture?.date, dateFormat);

  if (!isWithinWindow) {
    return {
      title: 'Next Game',
      content: `No game in the next ${windowDays} days.`,
      meta: formatGameTime(team?.nextFixture?.utcDate, team?.nextFixture?.venueTimezone) ||
        `${dateStr} ${team?.nextFixture?.time || ''}`.trim(),
    };
  }

  const timeStr =
    formatGameTime(team?.nextFixture?.utcDate, team?.nextFixture?.venueTimezone) ||
    `${dateStr} ${team?.nextFixture?.time || ''}`.trim();

  return {
    title: 'Next Game',
    content: `vs ${team?.nextFixture?.opponent || 'TBD'} at ${team?.nextFixture?.venue || 'Venue TBD'}`,
    meta: timeStr,
    opponentLogoUrl: team?.nextFixture?.opponentLogoUrl || null,
  };
}

function formatStatLabel(label) {
  return label
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (char) => char.toUpperCase());
}

export { getLatestResultPanel, getNextGamePanel, formatStatLabel };
