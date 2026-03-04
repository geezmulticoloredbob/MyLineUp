import PageContainer from '../components/common/PageContainer';
import TeamCard from '../features/dashboard/components/TeamCard';

function DashboardPage() {
  return (
    <PageContainer title="Your Teams">
      <TeamCard />
    </PageContainer>
  );
}

export default DashboardPage;

