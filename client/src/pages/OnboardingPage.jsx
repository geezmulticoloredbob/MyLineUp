import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { teamsByLeague } from '../data/teamsByLeague';
import { saveFavouriteTeam } from '../features/favourites/services/favouritesApi';
import { updateFollowedLeagues, completeOnboarding } from '../services/leagueApi';

const LEAGUES = ['NBA', 'EPL', 'AFL'];

function OnboardingPage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [activeLeague, setActiveLeague] = useState('NBA');
  const [selectedTeams, setSelectedTeams] = useState({});
  const [followedLeagues, setFollowedLeagues] = useState(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') handleSkip();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  function toggleTeam(league, teamId, teamName) {
    const key = `${league}::${teamId}`;
    setSelectedTeams((prev) => {
      const next = { ...prev };
      if (next[key]) {
        delete next[key];
      } else {
        next[key] = { league, teamId, teamName };
      }
      return next;
    });
  }

  function toggleLeague(league) {
    setFollowedLeagues((prev) => {
      const next = new Set(prev);
      next.has(league) ? next.delete(league) : next.add(league);
      return next;
    });
  }

  async function handleFinish() {
    setSaving(true);
    try {
      const saves = Object.values(selectedTeams).map((t) => saveFavouriteTeam(t));
      const leagueUpdate = updateFollowedLeagues([...followedLeagues]);
      await Promise.all([...saves, leagueUpdate]);
      await completeOnboarding();
      updateUser({ onboardingComplete: true, followedLeagues: [...followedLeagues] });
      navigate('/');
    } catch {
      // Non-fatal — still proceed to dashboard
      navigate('/');
    }
  }

  async function handleSkip() {
    try {
      await completeOnboarding();
    } finally {
      updateUser({ onboardingComplete: true });
      navigate('/');
    }
  }

  const teams = teamsByLeague[activeLeague] || [];

  return (
    <div className="onboarding-page">
      <div className="onboarding-card">
        <div className="onboarding-header">
          <div>
            <h1 className="onboarding-title">Welcome{user?.username ? `, ${user.username}` : ''}!</h1>
            <p className="onboarding-subtitle">Pick the teams and leagues you want to follow.</p>
          </div>
          <button className="modal__close" type="button" onClick={handleSkip} aria-label="Skip onboarding" disabled={saving}>
            <X size={20} />
          </button>
        </div>

        <div className="league-tabs">
          {LEAGUES.map((l) => (
            <button
              key={l}
              className={`league-tab${activeLeague === l ? ' league-tab--active' : ''}`}
              onClick={() => setActiveLeague(l)}
            >
              {l}
            </button>
          ))}
        </div>

        <div className="onboarding-follow-league">
          <label className="onboarding-follow-label">
            <input
              type="checkbox"
              checked={followedLeagues.has(activeLeague)}
              onChange={() => toggleLeague(activeLeague)}
            />
            Follow {activeLeague} standings on dashboard
          </label>
        </div>

        <ul className="team-list onboarding-team-list">
          {teams.map(({ teamId, teamName }) => {
            const key = `${activeLeague}::${teamId}`;
            const selected = !!selectedTeams[key];
            return (
              <li key={teamId} className="team-list__item">
                <span className="team-list__name">{teamName}</span>
                <button
                  className={`btn-toggle${selected ? ' btn-toggle--active' : ''}`}
                  onClick={() => toggleTeam(activeLeague, teamId, teamName)}
                >
                  {selected ? 'Remove' : '+ Add'}
                </button>
              </li>
            );
          })}
        </ul>

        <div className="onboarding-footer">
          <button className="btn-secondary" onClick={handleSkip} disabled={saving}>
            Skip for now
          </button>
          <button className="btn-primary" onClick={handleFinish} disabled={saving}>
            {saving ? 'Saving...' : 'Get started'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default OnboardingPage;
