import { createContext, useContext, useEffect, useState } from 'react';

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

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  function setTheme(t) {
    setThemeState(t);
    localStorage.setItem('mylineup_theme', t);
  }

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
    <ThemeContext.Provider value={{ theme, setTheme, bgTeamId, bgTeamName, setBgTeam }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
