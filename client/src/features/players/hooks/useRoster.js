import { useEffect, useState } from 'react';
import { fetchRoster } from '../services/playersApi';

// Per-team cache so switching back to an already-loaded team's roster in the
// same session doesn't re-hit the API (ESPN rosters are already cached
// server-side for 24h anyway — this just avoids the extra round trip).
const rosterCache = new Map();

export function useRoster(league, team) {
  const [roster, setRoster] = useState([]);
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    if (!team) {
      setRoster([]);
      setStatus('idle');
      return;
    }

    const cacheKey = `${league}-${team.teamId}`;
    const cached = rosterCache.get(cacheKey);
    if (cached) {
      setRoster(cached);
      setStatus('ready');
      return;
    }

    let cancelled = false;
    setStatus('loading');
    fetchRoster(league, team.teamId, team.teamName)
      .then(({ players }) => {
        if (cancelled) return;
        rosterCache.set(cacheKey, players);
        setRoster(players);
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });

    return () => { cancelled = true; };
  }, [league, team]);

  return { roster, status };
}
