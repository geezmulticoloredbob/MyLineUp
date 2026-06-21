import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Moon, Settings, Sun, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useFavouritesRefresh } from '../contexts/FavouritesContext';
import { useTheme } from '../contexts/ThemeContext';
import { teamColors } from '../data/teamColors';
import { updateUserIcon } from '../features/auth/services/authApi';
import { USER_ICONS, getIcon } from '../constants/userIcons';
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

const DATE_FORMATS = ['DD-MM-YYYY', 'MM-DD-YYYY', 'YYYY-MM-DD'];

function SettingsPanel() {
  const { theme, setTheme, bgTeamId, setBgTeam, dateFormat, setDateFormat } = useTheme();

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
        <span className="settings-panel__label">Date Format</span>
        <div className="settings-panel__toggle settings-panel__toggle--col">
          {DATE_FORMATS.map((f) => (
            <button
              key={f}
              type="button"
              className={`settings-toggle__btn${dateFormat === f ? ' settings-toggle__btn--active' : ''}`}
              onClick={() => setDateFormat(f)}
            >
              {f}
            </button>
          ))}
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

function IconPickerPanel({ currentIconId, onSelect }) {
  return (
    <div className="settings-panel icon-picker-panel" role="dialog" aria-label="Choose icon">
      <span className="settings-panel__label">Choose icon</span>
      <div className="icon-picker__grid">
        {USER_ICONS.map((icon) => (
          <button
            key={icon.id}
            type="button"
            className={`icon-picker__item${currentIconId === icon.id ? ' icon-picker__item--active' : ''}`}
            onClick={() => onSelect(icon.id)}
            title={icon.label}
            aria-label={icon.label}
            aria-pressed={currentIconId === icon.id}
          >
            {icon.emoji}
          </button>
        ))}
      </div>
    </div>
  );
}

function AppShell({ children }) {
  const { user, logout, updateUser } = useAuth();
  const { managerOpen, openManager, closeManager } = useFavouritesRefresh();
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const settingsWrapRef = useRef(null);
  const iconWrapRef = useRef(null);

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

  useEffect(() => {
    if (!iconPickerOpen) return;
    function handler(e) {
      if (iconWrapRef.current && !iconWrapRef.current.contains(e.target)) {
        setIconPickerOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [iconPickerOpen]);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  async function handleSelectIcon(iconId) {
    setIconPickerOpen(false);
    try {
      const { user: updated } = await updateUserIcon(iconId);
      updateUser({ iconId: updated.iconId });
    } catch {
      // best-effort
    }
  }

  const userIcon = getIcon(user?.iconId);

  return (
    <div className="app-shell">
      <BgOverlay />
      <header className="app-shell__header">
        <span className="app-shell__wordmark">My<span className="app-shell__wordmark-accent">LineUp</span></span>
        <div className="app-shell__header-actions">
          {user && (
            <div className="user-identity">
              <div className="settings-wrap" ref={iconWrapRef}>
                <button
                  type="button"
                  className="user-avatar"
                  onClick={() => setIconPickerOpen((o) => !o)}
                  aria-label="Change icon"
                  aria-expanded={iconPickerOpen}
                  title="Change icon"
                >
                  {userIcon.emoji}
                </button>
                {iconPickerOpen && (
                  <IconPickerPanel
                    currentIconId={user.iconId ?? 'football'}
                    onSelect={handleSelectIcon}
                  />
                )}
              </div>
              <span className="app-shell__username">{user.username}</span>
            </div>
          )}
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
            Log Out
          </button>
        </div>
      </header>
      <main className="app-shell__main">{children}</main>
      {managerOpen && <FavouritesManager onClose={closeManager} />}
    </div>
  );
}

export default AppShell;
