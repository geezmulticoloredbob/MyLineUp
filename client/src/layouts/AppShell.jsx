import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useFavouritesRefresh } from '../contexts/FavouritesContext';
import FavouritesManager from '../features/favourites/components/FavouritesManager';

function AppShell({ children }) {
  const { user, logout } = useAuth();
  const { managerOpen, openManager, closeManager } = useFavouritesRefresh();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="app-shell">
      <header className="app-shell__header">
        <span className="app-shell__wordmark">My<span className="app-shell__wordmark-accent">LineUp</span></span>
        <div className="app-shell__header-actions">
          {user && <span className="app-shell__username">{user.username}</span>}
          <button type="button" className="btn-secondary" onClick={openManager}>
            Manage Favourites
          </button>
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
