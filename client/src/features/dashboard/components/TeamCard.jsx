function TeamCard({ team }) {
  const isLatestPriority = team.priority === 'latest';

  return (
    <article>
      <header>
        <img src={team.logoUrl} alt={`${team.teamName} logo`} width={48} height={48} />
        <div>
          <h2>{team.teamName}</h2>
          <p>{team.league}</p>
        </div>
      </header>

      <p>Ladder Position: #{team.ladderPosition}</p>

      <section>
        {isLatestPriority ? <h3>Latest Result</h3> : <h3>Up Next</h3>}
        {isLatestPriority ? (
          <p>
            {team.latestResult.outcome} vs {team.latestResult.opponent} ({team.latestResult.score})
          </p>
        ) : (
          <p>
            vs {team.nextFixture.opponent} at {team.nextFixture.venue} ({team.nextFixture.date})
          </p>
        )}
      </section>

      <section>
        <h3>Basic Stats</h3>
        <pre>{JSON.stringify(team.stats, null, 2)}</pre>
      </section>
    </article>
  );
}

export default TeamCard;
