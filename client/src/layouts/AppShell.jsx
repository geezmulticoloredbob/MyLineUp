import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Moon, Settings, Sun, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useFavouritesRefresh } from '../contexts/FavouritesContext';
import { useTheme } from '../contexts/ThemeContext';
import FavouritesManager from '../features/favourites/components/FavouritesManager';

const LOGO_FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' fill='%23333'/%3E%3Ccircle cx='20' cy='15' r='6' fill='%23555'/%3E%3Cpath d='M8 36c0-6.627 5.373-12 12-12s12 5.373 12 12' fill='%23555'/%3E%3C/svg%3E";

function BgOverlay() {
  const { bgLogoUrl } = useTheme();
  const bgRoot = document.getElementById('bg-root');
  if (!bgLogoUrl || !bgRoot) return null;
  return createPortal(
    <div
      className="bg-overlay"
      style={{ backgroundImage: `url(${bgLogoUrl})` }}
      aria-hidden="true"
    />,
    bgRoot
  );
}

function SettingsPanel({ onClose }) {
  const { theme, setTheme, bgLogoUrl, setBgLogo } = useTheme();

  const savedTeams = (() => {
    try { return JSON.parse(localStorage.getItem('mylineup_bg_teams') || '[]'); }
    catch { return []; }
  })();

  return (
    <div className="settings-panel" role="dialog" aria-label="Settings">
      <div className="settings-panel__section">
        <span className="settings-panel__label">Theme</span>
        <div className="settings-panel__toggle">
          <button
            type="button"
            className={`settings-toggle__btn${theme === 'dark' ? ' settings-toggle__btn--active' : ''}`}
            onClick={() => setTheme('dark')}
          >
            <Moon size={13} strokeWidth={2} /> Dark
          </button>
          <button
            type="button"
            className={`settings-toggle__btn${theme === 'light' ? ' settings-toggle__btn--active' : ''}`}
            onClick={() => setTheme('light')}
          >
            <Sun size={13} strokeWidth={2} /> Light
          </button>
        </div>
      </div>

      <div className="settings-panel__section">
        <span className="settings-panel__label">Background</span>
        <div className="settings-panel__bg-grid">
          <button
            type="button"
            className={`settings-bg__item settings-bg__item--none${!bgLogoUrl ? ' settings-bg__item--active' : ''}`}
            onClick={() => setBgLogo(null, null)}
            title="No background"
          >
            <X size={14} />
          </button>
          {savedTeams.map((team) => (
            <button
              key={team.teamName}
              type="button"
              className={`settings-bg__item${bgLogoUrl === team.teamLogoUrl ? ' settings-bg__item--active' : ''}`}
              onClick={() => setBgLogo(team.teamLogoUrl, team.teamName)}
              title={team.teamName}
            >
              <img
                src={team.teamLogoUrl || LOGO_FALLBACK}
                alt={team.teamName}
                width={28}
                height={28}
              />
            </button>
          ))}
          {savedTeams.length === 0 && (
            <p className="settings-bg__empty">Load the dashboard to see your teams</p>
          )}
        </div>
      </div>
    </div>
  );
}

function AppShell({ children }) {
  const { user, logout } = useAuth();
  const { managerOpen, openManager, closeManager } = useFavouritesRefresh();
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsWrapRef = useRef(null);

  useEffect(() => {
    if (!settingsOpen) return;
    function handler(e) {
      if (settingsWrapRef.current && !settingsWrapRef.current.contains(e.target)) {
        setSettingsOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [settingsOpen]);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="app-shell">
      <BgOverlay />
      <header className="app-shell__header">
        <span className="app-shell__wordmark">My<span className="app-shell__wordmark-accent">LineUp</span></span>
        <div className="app-shell__header-actions">
          {user && <span className="app-shell__username">{user.username}</span>}
          <button type="button" className="btn-secondary" onClick={openManager}>
            Manage Favourites
          </button>
          <div className="settings-wrap" ref={settingsWrapRef}>
            <button
              type="button"
              className="btn-icon"
              onClick={() => setSettingsOpen((o) => !o)}
              aria-label="Settings"
              aria-expanded={settingsOpen}
            >
              <Settings size={16} strokeWidth={2} />
            </button>
            {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}
          </div>
          <button type="button" className="btn-secondary" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </header>
      <main className="app-shell__main">{children}</main>
      {managerOpen && <FavouritesManager onClose={closeManager} />}
    </div>
  );
}

export default AppShell;
