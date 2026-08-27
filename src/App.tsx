import { useState } from "react";
import { ledger } from "./data/ledger";
import { roster } from "./data/roster";
import { scoreEvents } from "./engine/scoring";
import { calculateAgentTotals } from "./engine/totals";
import { buildLeaderboard } from "./engine/leaderboard";

function App() {
  const [recomputeKey, setRecomputeKey] = useState(0);

  const results = scoreEvents(ledger, roster);
  const totals = calculateAgentTotals(results, roster);
  const leaderboard = buildLeaderboard(totals, roster);

  void recomputeKey;

  const agentNames = new Map(
    roster.map((agent) => [agent.agentId, agent.name]),
  );

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>Lyka One</h1>
          <p>Sales Performance Leaderboard</p>
        </div>

        <button onClick={() => setRecomputeKey((key) => key + 1)}>
  Recompute
</button>
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

        {/* Leaderboard */}
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

        {/* Event Ledger */}
        <section className="ledger-section">
          <h2>Event Ledger</h2>
          <p className="section-description">
            Every ledger event and its scoring outcome.
          </p>

          <div className="table-container">
            <table className="ledger-table">
              <thead>
                <tr>
                  <th>Event ID</th>
                  <th>Agent</th>
                  <th>Event Type</th>
                  <th>Occurred At</th>
                  <th>Source</th>
                  <th>Status</th>
                  <th>Points</th>
                  <th>Reason</th>
                </tr>
              </thead>

              <tbody>
                {results.map((result) => (
                  <tr
                    key={`${result.eventId}-${result.agentId}-${result.eventType}`}
                    className={result.flagged ? "flagged-row" : ""}
                  >
                    <td>
                      <strong>{result.eventId}</strong>
                    </td>

                    <td>
                      <strong>
                        {agentNames.get(result.agentId) ?? "Unknown"}
                      </strong>
                      <small>{result.agentId}</small>
                    </td>

                    <td>{result.eventType}</td>

                    <td>
                      {ledger.find(
                        (event) => event.eventId === result.eventId,
                      )?.occurredAt ?? "-"}
                    </td>

                    <td>
                      {ledger.find(
                        (event) => event.eventId === result.eventId,
                      )?.source ?? "-"}
                    </td>

                    <td>
                      <span
                        className={`status status-${result.status.toLowerCase()}`}
                      >
                        {result.status}
                      </span>
                    </td>

                    <td>
                      <strong>{result.points}</strong>
                    </td>

                    <td>
                      <span className="reason">
                        {result.reason}
                      </span>

                      {result.flagged && result.flagReason && (
                        <small className="flag-reason">
                          {result.flagReason}
                        </small>
                      )}
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