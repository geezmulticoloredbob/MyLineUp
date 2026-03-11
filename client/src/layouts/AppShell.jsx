function AppShell({ children }) {
  return (
    <div className="app-shell">
      <header className="app-shell__header">
        <span>MyLineup</span>
        <button type="button" className="btn-primary">
          Manage Favourites
        </button>
      </header>
      <main className="app-shell__main">{children}</main>
    </div>
  );
}

export default AppShell;
