import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const DEFAULT_LEAGUE_ORDER = ['NBA', 'EPL', 'AFL', 'WC', 'LALIGA', 'BUNDESLIGA', 'SERIEA', 'LIGUE1', 'CHAMPIONSHIP', 'EREDIVISIE', 'UCL', 'NFL', 'NHL', 'MLB'];

function readJson(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(
    () => localStorage.getItem('mylineup_theme') || 'dark'
  );
  const [bgTeamId, setBgTeamIdState] = useState(
    () => localStorage.getItem('mylineup_bg_team') || null
  );
  const [bgTeamName, setBgTeamNameState] = useState(
    () => localStorage.getItem('mylineup_bg_team_name') || null
  );
  const [dateFormat, setDateFormatState] = useState(
    () => localStorage.getItem('mylineup_date_format') || 'DD-MM-YYYY'
  );
  const [leagueOrder, setLeagueOrderState] = useState(
    () => readJson('mylineup_league_order', DEFAULT_LEAGUE_ORDER)
  );
  const [teamOrder, setTeamOrderState] = useState(
    () => readJson('mylineup_team_order', [])
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  function setTheme(t) {
    setThemeState(t);
    localStorage.setItem('mylineup_theme', t);
  }

  function setDateFormat(f) {
    setDateFormatState(f);
    localStorage.setItem('mylineup_date_format', f);
  }

  function setLeagueOrder(order) {
    setLeagueOrderState(order);
    localStorage.setItem('mylineup_league_order', JSON.stringify(order));
  }

  const setTeamOrder = useCallback((updater) => {
    setTeamOrderState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      localStorage.setItem('mylineup_team_order', JSON.stringify(next));
      return next;
    });
  }, []);

  function setBgTeam(teamId, teamName) {
    setBgTeamIdState(teamId || null);
    setBgTeamNameState(teamName || null);
    if (teamId) {
      localStorage.setItem('mylineup_bg_team', teamId);
      localStorage.setItem('mylineup_bg_team_name', teamName || '');
    } else {
      localStorage.removeItem('mylineup_bg_team');
      localStorage.removeItem('mylineup_bg_team_name');
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, bgTeamId, bgTeamName, setBgTeam, dateFormat, setDateFormat, leagueOrder, setLeagueOrder, teamOrder, setTeamOrder }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
