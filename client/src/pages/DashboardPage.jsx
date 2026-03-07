import PageContainer from '../components/common/PageContainer';
import TeamCard from '../features/dashboard/components/TeamCard';
import { mockTeams } from '../mocks/mockTeams';

function DashboardPage() {
  const teamLoadState = 'ready';

  if (teamLoadState === 'loading') {
    return (
      <PageContainer title="Your Teams">
        <TeamCard status="loading" />
      </PageContainer>
    );
  }

  if (teamLoadState === 'error') {
    return (
      <PageContainer title="Your Teams">
        <TeamCard status="error" errorMessage="Unable to reach sports service." />
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Your Teams">
      {mockTeams.length === 0 ? (
        <TeamCard status="empty" />
      ) : (
        mockTeams.map((team) => <TeamCard key={team.id} team={team} />)
      )}
    </PageContainer>
  );
}

export default DashboardPage;
