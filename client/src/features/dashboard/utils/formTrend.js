// TeamSnapshot rows are captured once per UTC day (see server's
// snapshotService.js), so consecutive rows often describe the same
// underlying game — nothing new happened that day, so the "latest result"
// just got re-captured unchanged. Collapse those runs down to the distinct
// games they actually represent before taking the most recent few, so a
// team that hasn't played in a week doesn't show the same result 5 times.
function resultKey(result) {
  if (!result) return null;
  return [result.date, result.opponent, result.score].join('|');
}

// history is oldest-first (see server's getTeamHistory); this preserves that
// order so a "form" strip reads oldest→newest, left to right.
function getRecentForm(history, limit = 5) {
  const distinct = [];
  let lastKey = null;

  for (const snapshot of history || []) {
    const key = resultKey(snapshot?.latestResult);
    if (!key || key === lastKey) continue;
    distinct.push(snapshot.latestResult);
    lastKey = key;
  }

  return distinct.slice(-limit);
}

export { getRecentForm };
