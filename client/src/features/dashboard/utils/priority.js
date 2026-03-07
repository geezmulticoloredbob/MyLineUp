function resolvePriorityPanel(team) {
  const priority = team?.priority === 'latest' ? 'latest' : 'upNext';

  if (priority === 'latest') {
    return {
      title: 'Latest Result',
      content: `${team?.latestResult?.outcome || '-'} vs ${team?.latestResult?.opponent || 'TBD'} (${team?.latestResult?.score || 'TBD'})`,
      meta: team?.latestResult?.date || 'Date TBD',
    };
  }

  return {
    title: 'Up Next',
    content: `vs ${team?.nextFixture?.opponent || 'TBD'} at ${team?.nextFixture?.venue || 'Venue TBD'}`,
    meta: `${team?.nextFixture?.date || 'Date TBD'} ${team?.nextFixture?.time || ''}`.trim(),
  };
}

function formatStatLabel(label) {
  return label
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (char) => char.toUpperCase());
}

export { resolvePriorityPanel, formatStatLabel };

