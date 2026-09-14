import { TrendingUp } from 'lucide-react';
import { useTeamTrend } from '../hooks/useTeamTrend';
import { getRecentForm } from '../utils/formTrend';

function badgeClassName(outcome) {
  if (outcome === 'W') return 'team-form__badge team-form__badge--win';
  if (outcome === 'L') return 'team-form__badge team-form__badge--loss';
  if (outcome === 'D') return 'team-form__badge team-form__badge--draw';
  return 'team-form__badge';
}

function TeamFormStrip({ league, teamId }) {
  const { history, loading } = useTeamTrend(league, teamId);
  const form = getRecentForm(history);

  // Snapshot history builds up one row per day — nothing to show yet for a
  // newly-favourited team (or while still loading), so render nothing
  // rather than an empty section.
  if (loading || form.length === 0) return null;

  return (
    <section className="team-card__section team-form">
      <h3 className="team-card__section-title">
        <TrendingUp size={14} strokeWidth={2} />
        Recent Form
      </h3>
      <div className="team-form__strip">
        {form.map((result, i) => (
          <span
            key={`${result.date}-${i}`}
            className={badgeClassName(result.outcome)}
            title={`${result.outcome || '?'} vs ${result.opponent || 'TBD'} (${result.score || 'TBD'})`}
          >
            {result.outcome || '?'}
          </span>
        ))}
      </div>
    </section>
  );
}

export default TeamFormStrip;
