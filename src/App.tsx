import { ledger } from "./data/ledger";
import { roster } from "./data/roster";
import { scoreEvents } from "./engine/scoring";
import { calculateAgentTotals } from "./engine/totals";
import { buildLeaderboard } from "./engine/leaderboard";

function App() {
  const results = scoreEvents(ledger, roster);
  const totals = calculateAgentTotals(results, roster);
  const leaderboard = buildLeaderboard(totals, roster);

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>Lyka One</h1>
          <p>Sales Performance Leaderboard</p>
        </div>

        <button>Recompute</button>
      </header>

      <main>
        <section className="summary">
          <div>
            <span>Events</span>
            <strong>{ledger.length}</strong>
          </div>

          <div>
            <span>Agents</span>
            <strong>{roster.length}</strong>
          </div>

          <div>
            <span>Season</span>
            <strong>August 2026</strong>
          </div>
        </section>

        <section>
          <h2>Leaderboard</h2>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Agent</th>
                  <th>Total Points</th>
                  <th>Breakdown</th>
                </tr>
              </thead>

              <tbody>
                {leaderboard.map((agent) => (
                  <tr key={agent.agentId}>
                    <td>#{agent.rank}</td>

                    <td>
                      <strong>{agent.name}</strong>
                      <small>{agent.agentId}</small>
                    </td>

                    <td>
                      <strong>{agent.totalPoints}</strong>
                    </td>

                    <td>
                      <div className="breakdown">
                        {Object.entries(agent.breakdown).map(
                          ([eventType, points]) => (
                            <span key={eventType}>
                              {eventType}: {points}
                            </span>
                          ),
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;