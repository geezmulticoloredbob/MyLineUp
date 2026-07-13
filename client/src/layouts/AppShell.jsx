import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useFavouritesRefresh } from '../contexts/FavouritesContext';
import { useTheme } from '../contexts/ThemeContext';
import { teamColors } from '../data/teamColors';
import { getIcon } from '../constants/userIcons';
import FavouritesManager from '../features/favourites/components/FavouritesManager';
import AccountMenu from '../components/common/AccountMenu';

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

function AppShell({ children }) {
  const { user } = useAuth();
  const { managerOpen, openManager, closeManager } = useFavouritesRefresh();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuWrapRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handler(e) {
      if (menuWrapRef.current && !menuWrapRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const userIcon = getIcon(user?.iconId);

  return (
    <div className="app-shell">
      <BgOverlay />
      <header className="app-shell__header">
        <span className="app-shell__wordmark">My<span className="app-shell__wordmark-accent">LineUp</span></span>
        <div className="app-shell__header-actions">
          <button type="button" className="btn-secondary" onClick={openManager}>
            Manage Favourites
          </button>
          {user && (
            <div className="settings-wrap" ref={menuWrapRef}>
              <button
                type="button"
                className="user-menu-trigger"
                onClick={() => setMenuOpen((o) => !o)}
                aria-label="Account menu"
                aria-expanded={menuOpen}
              >
                <span className="user-menu-trigger__icon">{userIcon.emoji}</span>
                <span className="user-menu-trigger__name">{user.username}</span>
                <ChevronDown
                  size={14}
                  strokeWidth={2}
                  className={`user-menu-trigger__chevron${menuOpen ? ' user-menu-trigger__chevron--open' : ''}`}
                  aria-hidden="true"
                />
              </button>
              {menuOpen && <AccountMenu onClose={() => setMenuOpen(false)} />}
            </div>
          )}
        </div>
      </header>
      <main className="app-shell__main">{children}</main>
      {managerOpen && <FavouritesManager onClose={closeManager} />}
    </div>
  );
}

export default AppShell;
