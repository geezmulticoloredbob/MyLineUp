import AppShell from '../layouts/AppShell';
import DashboardPage from '../pages/DashboardPage';

function AppRouter() {
  return (
    <AppShell>
      <DashboardPage />
    </AppShell>
  );
}

export default AppRouter;

