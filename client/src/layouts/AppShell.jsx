function AppShell({ children }) {
  return (
    <div className="app-shell">
      <header className="app-shell__header">MyLineup</header>
      <main>{children}</main>
    </div>
  );
}

export default AppShell;

