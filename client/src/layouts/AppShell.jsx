import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Moon, Settings, Sun, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useFavouritesRefresh } from '../contexts/FavouritesContext';
import { useTheme } from '../contexts/ThemeContext';
import { teamColors } from '../data/teamColors';
import FavouritesManager from '../features/favourites/components/FavouritesManager';

function BgOverlay() {
  const { bgTeamId } = useTheme();
  const bgRoot = document.getElementById('bg-root');
  const colors = bgTeamId ? teamColors[bgTeamId] : null;
  if (!colors || !bgRoot) return null;
  return createPortal(
    <div
      className="bg-overlay"
      style={{
        background: `radial-gradient(ellipse at 70% 10%, ${colors.primary} 0%, ${colors.secondary} 50%, transparent 72%)`,
      }}
      aria-hidden="true"
    />,
    bgRoot
  );
}

function SettingsPanel() {
  const { theme, setTheme, bgTeamId, setBgTeam } = useTheme();

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
            className={`settings-bg__item settings-bg__item--none${!bgTeamId ? ' settings-bg__item--active' : ''}`}
            onClick={() => setBgTeam(null, null)}
            title="No background"
          >
            <X size={14} />
          </button>
          {savedTeams.map((team) => {
            const colors = teamColors[team.teamId];
            return (
              <button
                key={team.teamId}
                type="button"
                className={`settings-bg__item${bgTeamId === team.teamId ? ' settings-bg__item--active' : ''}`}
                onClick={() => setBgTeam(team.teamId, team.teamName)}
                title={team.teamName}
              >
                <div
                  className="settings-bg__swatch"
                  style={{
                    background: colors
                      ? `linear-gradient(135deg, ${colors.primary} 50%, ${colors.secondary} 50%)`
                      : '#333',
                  }}
                />
              </button>
            );
          })}
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
            {settingsOpen && <SettingsPanel />}
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
