function parseDate(dateValue) {
  if (!dateValue) {
    return null;
  }

  const parsed = new Date(dateValue);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getLatestResultPanel(team, windowDays = 30) {
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

  if (!isWithinWindow) {
    return {
      title: 'Last Result',
      content: `No result in the last ${windowDays} days.`,
      meta: team?.latestResult?.date,
    };
  }

  return {
    title: 'Last Result',
    content: `${team?.latestResult?.outcome || '-'} vs ${team?.latestResult?.opponent || 'TBD'} (${team?.latestResult?.score || 'TBD'})`,
    meta: team?.latestResult?.date,
  };
}

function getNextGamePanel(team, windowDays = 30) {
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

  if (!isWithinWindow) {
    return {
      title: 'Next Game',
      content: `No game in the next ${windowDays} days.`,
      meta: `${team?.nextFixture?.date || ''} ${team?.nextFixture?.time || ''}`.trim(),
    };
  }

  return {
    title: 'Next Game',
    content: `vs ${team?.nextFixture?.opponent || 'TBD'} at ${team?.nextFixture?.venue || 'Venue TBD'}`,
    meta: `${team?.nextFixture?.date || ''} ${team?.nextFixture?.time || ''}`.trim(),
  };
}

function formatStatLabel(label) {
  return label
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (char) => char.toUpperCase());
}

export { getLatestResultPanel, getNextGamePanel, formatStatLabel };
