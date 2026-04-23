import { useEffect, useState } from 'react';
import { apiClient } from '../services/apiClient';
import { useFavouritesRefresh } from '../contexts/FavouritesContext';
import PageContainer from '../components/common/PageContainer';
import TeamCard from '../features/dashboard/components/TeamCard';

function DashboardPage() {
  const { refreshTick } = useFavouritesRefresh();
  const [teams, setTeams] = useState([]);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    setStatus('loading');
    apiClient('/api/dashboard')
      .then(({ teams }) => {
        setTeams(teams);
        setStatus(teams.length === 0 ? 'empty' : 'ready');
      })
      .catch(() => setStatus('error'));
  }, [refreshTick]);

  if (status === 'loading') {
    return (
      <PageContainer title="Your Teams">
        <div className="team-card-grid">
          <TeamCard status="loading" />
          <TeamCard status="loading" />
          <TeamCard status="loading" />
        </div>
      </PageContainer>
    );
  }

  if (status === 'error') {
    return (
      <PageContainer title="Your Teams">
        <TeamCard status="error" errorMessage="Unable to reach sports service." />
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Your Teams">
      {status === 'empty' ? (
        <TeamCard status="empty" />
      ) : (
        <div className="team-card-grid">
          {teams.map((team) => (
            <TeamCard key={team.favouriteId} team={team} />
          ))}
        </div>
      )}
    </PageContainer>
  );
}

export default DashboardPage;
