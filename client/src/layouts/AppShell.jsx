import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function AppShell({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="app-shell">
      <header className="app-shell__header">
        <span>MyLineup</span>
        <div className="app-shell__header-actions">
          {user && <span className="app-shell__username">{user.username}</span>}
          <button type="button" className="btn-primary" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </header>
      <main className="app-shell__main">{children}</main>
    </div>
  );
}

export default AppShell;
