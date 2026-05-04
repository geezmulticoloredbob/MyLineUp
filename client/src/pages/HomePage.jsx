import { useEffect, useState } from 'react';
import { apiClient } from '../services/apiClient';
import { useFavouritesRefresh } from '../contexts/FavouritesContext';
import { usePageTitle } from '../hooks/usePageTitle';
import PageContainer from '../components/common/PageContainer';
import TeamCard from '../features/dashboard/components/TeamCard';
import LeagueCard from '../features/dashboard/components/LeagueCard';
import FavouritesManager from '../features/favourites/components/FavouritesManager';

function EmptyState({ onOpen }) {
  return (
    <div className="empty-state">
      <p className="empty-state__title">Nothing here yet</p>
      <p className="empty-state__body">Follow some teams or leagues to fill your dashboard.</p>
      <button className="btn-primary" type="button" onClick={onOpen}>
        Add teams &amp; leagues
      </button>
    </div>
  );
}

function HomePage() {
  usePageTitle('Dashboard');
  const { refreshTick, triggerRefresh } = useFavouritesRefresh();
  const [teams, setTeams] = useState([]);
  const [leagueOverviews, setLeagueOverviews] = useState([]);
  const [status, setStatus] = useState('loading');
  const [managerOpen, setManagerOpen] = useState(false);

  useEffect(() => {
    setStatus('loading');
    apiClient('/api/dashboard')
      .then(({ teams, leagueOverviews }) => {
        setTeams(teams);
        setLeagueOverviews(leagueOverviews || []);
        setStatus(teams.length === 0 && (leagueOverviews?.length ?? 0) === 0 ? 'empty' : 'ready');
      })
      .catch(() => setStatus('error'));
  }, [refreshTick]);

  function handleCloseManager() {
    setManagerOpen(false);
    triggerRefresh();
  }

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
        <EmptyState onOpen={() => setManagerOpen(true)} />
        {managerOpen && <FavouritesManager onClose={handleCloseManager} />}
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Your Teams">
      {leagueOverviews.length > 0 && (
        <div className="league-card-grid">
          {leagueOverviews.map((overview) => (
            <LeagueCard key={overview.league} {...overview} />
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
      {managerOpen && <FavouritesManager onClose={handleCloseManager} />}
    </PageContainer>
  );
}

export default HomePage;
