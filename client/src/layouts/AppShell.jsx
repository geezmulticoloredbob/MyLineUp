import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useFavouritesRefresh } from '../contexts/FavouritesContext';
import FavouritesManager from '../features/favourites/components/FavouritesManager';

function AppShell({ children }) {
  const { user, logout } = useAuth();
  const { triggerRefresh } = useFavouritesRefresh();
  const navigate = useNavigate();
  const [managerOpen, setManagerOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  function handleCloseManager() {
    setManagerOpen(false);
    triggerRefresh();
  }

  return (
    <div className="app-shell">
      <header className="app-shell__header">
        <span>MyLineup</span>
        <div className="app-shell__header-actions">
          {user && <span className="app-shell__username">{user.username}</span>}
          <button type="button" className="btn-primary" onClick={() => setManagerOpen(true)}>
            Manage Favourites
          </button>
          <button type="button" className="btn-secondary" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </header>
      <main className="app-shell__main">{children}</main>
      {managerOpen && <FavouritesManager onClose={handleCloseManager} />}
    </div>
  );
}

export default AppShell;
