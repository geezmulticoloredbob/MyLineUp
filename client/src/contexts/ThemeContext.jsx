import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(
    () => localStorage.getItem('mylineup_theme') || 'dark'
  );
  const [bgLogoUrl, setBgLogoUrlState] = useState(
    () => localStorage.getItem('mylineup_bg_logo') || null
  );
  const [bgLogoName, setBgLogoNameState] = useState(
    () => localStorage.getItem('mylineup_bg_logo_name') || null
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  function setTheme(t) {
    setThemeState(t);
    localStorage.setItem('mylineup_theme', t);
  }

  function setBgLogo(url, name) {
    setBgLogoUrlState(url || null);
    setBgLogoNameState(name || null);
    if (url) {
      localStorage.setItem('mylineup_bg_logo', url);
      localStorage.setItem('mylineup_bg_logo_name', name || '');
    } else {
      localStorage.removeItem('mylineup_bg_logo');
      localStorage.removeItem('mylineup_bg_logo_name');
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, bgLogoUrl, bgLogoName, setBgLogo }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
