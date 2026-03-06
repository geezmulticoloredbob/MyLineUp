import PageContainer from '../components/common/PageContainer';
import TeamCard from '../features/dashboard/components/TeamCard';
import { mockTeams } from '../mocks/mockTeams';

function DashboardPage() {
  return (
    <PageContainer title="Your Teams">
      {mockTeams.map((team) => (
        <TeamCard key={team.id} team={team} />
      ))}
    </PageContainer>
  );
}

export default DashboardPage;
