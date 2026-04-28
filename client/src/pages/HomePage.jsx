import { useEffect, useState } from 'react';
import { apiClient } from '../services/apiClient';
import { useFavouritesRefresh } from '../contexts/FavouritesContext';
import PageContainer from '../components/common/PageContainer';
import TeamCard from '../features/dashboard/components/TeamCard';
import LeagueCard from '../features/dashboard/components/LeagueCard';

function HomePage() {
  const { refreshTick } = useFavouritesRefresh();
  const [teams, setTeams] = useState([]);
  const [leagueOverviews, setLeagueOverviews] = useState([]);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    setStatus('loading');
    apiClient('/api/dashboard')
      .then(({ teams, leagueOverviews }) => {
        setTeams(teams);
        setLeagueOverviews(leagueOverviews || []);
        setStatus(teams.length === 0 && leagueOverviews?.length === 0 ? 'empty' : 'ready');
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

  if (status === 'empty') {
    return (
      <PageContainer title="Your Teams">
        <TeamCard status="empty" />
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Your Teams">
      {leagueOverviews.length > 0 && (
        <div className="league-card-grid">
          {leagueOverviews.map(({ league, standings }) => (
            <LeagueCard key={league} league={league} standings={standings} />
          ))}
        </div>
      )}
      {teams.length > 0 && (
        <div className="team-card-grid">
          {teams.map((team) => (
            <TeamCard key={team.favouriteId} team={team} />
          ))}
        </div>
      )}
    </PageContainer>
  );
}

export default HomePage;
