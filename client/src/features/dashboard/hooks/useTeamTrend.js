import { useEffect, useState } from 'react';
import { fetchTeamTrend } from '../services/dashboardApi';

export function useTeamTrend(league, teamId) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!league || !teamId) {
      setHistory([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    fetchTeamTrend(league, teamId, { signal: controller.signal })
      .then(({ history }) => setHistory(history))
      .catch(() => {})
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [league, teamId]);

  return { history, loading };
}
