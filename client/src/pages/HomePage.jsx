import { useEffect, useState } from 'react';
import { apiClient } from '../services/apiClient';
import { useFavouritesRefresh } from '../contexts/FavouritesContext';
import { useAuth } from '../contexts/AuthContext';
import { usePageTitle } from '../hooks/usePageTitle';
import PageContainer from '../components/common/PageContainer';
import TeamCard from '../features/dashboard/components/TeamCard';
import LeagueCard, { SkeletonLeagueCard } from '../features/dashboard/components/LeagueCard';
import GamesFeed from '../features/dashboard/components/GamesFeed';

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
  const { refreshTick, openManager } = useFavouritesRefresh();
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [leagueOverviews, setLeagueOverviews] = useState([]);
  const [status, setStatus] = useState('loading');

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

  if (status === 'loading') {
    const followedLeagues = user?.followedLeagues ?? [];
    return (
      <PageContainer title="Your Teams">
        {followedLeagues.length > 0 && (
          <div className="league-card-grid">
            {followedLeagues.map((l) => <SkeletonLeagueCard key={l} />)}
          </div>
        )}
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
        <EmptyState onOpen={openManager} />
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
      <GamesFeed teams={teams} />
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
