import { useEffect, useState } from "react";
import "./App.css";
import { ledger } from "./data/ledger";
import { roster } from "./data/roster";
import { getDisplayBucket, scoreEvents } from "./engine/scoring";
import { formatOccurredAt } from "./utils/format";
import { SpotlightCard } from "./components/SpotlightCard";
import { Accordion } from "./components/Accordion";
import { LeaderboardRows } from "./components/LeaderboardRows";
import { calculateAgentTotals } from "./engine/totals";
import { buildLeaderboard } from "./engine/leaderboard";
import {
  reconcile,
  summarizeReconciliation,
} from "./engine/reconciliation";

const navigationSectionIds = [
  "leaderboard",
  "analytics",
  "event-ledger",
  "reconciliation",
  "anti-gaming",
] as const;

function App() {
  const [recomputeKey, setRecomputeKey] = useState(0);
  const [activeNav, setActiveNav] = useState("leaderboard");

  useEffect(() => {
    const sections = navigationSectionIds
      .map((id) => document.getElementById(id))
      .filter((section): section is HTMLElement => section !== null);
    const visibilityById = new Map<string, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          visibilityById.set(
            entry.target.id,
            entry.isIntersecting ? entry.intersectionRatio : 0,
          );
        });

        const mostVisibleSection = [...visibilityById.entries()].reduce<
          [string, number] | null
        >(
          (mostVisible, section) =>
            section[1] > (mostVisible?.[1] ?? 0) ? section : mostVisible,
          null,
        );

        if (mostVisibleSection && mostVisibleSection[1] > 0) {
          setActiveNav(mostVisibleSection[0]);
        }
      },
      {
        // Start tracking after a section reaches the upper third of the viewport.
        rootMargin: "-33% 0px -15% 0px",
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
      },
    );

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  const results = scoreEvents(ledger, roster);
  const totals = calculateAgentTotals(results, roster);
  const leaderboard = buildLeaderboard(totals, roster);

  const engineTotals = new Map(
    totals.map((agent) => [agent.agentId, agent.totalPoints]),
  );

  const reconciliationRows = reconcile(
    ledger,
    roster,
    engineTotals,
  );

  const reconciliationSummary =
    summarizeReconciliation(reconciliationRows);

  void recomputeKey;

  const agentNames = new Map(
    roster.map((agent) => [agent.agentId, agent.name]),
  );

  const flaggedEventsByAgent = new Map<
    string,
    Array<(typeof results)[number] & { occurredAt: string }>
  >();

  results.forEach((result, index) => {
    if (!result.flagged) {
      return;
    }

    const flaggedEvents = flaggedEventsByAgent.get(result.agentId) ?? [];
    flaggedEvents.push({
      ...result,
      occurredAt: ledger[index].occurredAt,
    });
    flaggedEventsByAgent.set(result.agentId, flaggedEvents);
  });

  const displayBucketCounts = {
    counted: 0,
    flagged: 0,
    capped: 0,
    excluded: 0,
    rejected: 0,
  };

  results.forEach((result) => {
    displayBucketCounts[getDisplayBucket(result)] += 1;
  });

  function getManagerFlagReason(
    result: (typeof results)[number],
  ): string {
    if (result.status === "CAPPED") {
      return "The daily limit was reached. Confirm this additional entry was intended; it does not earn points.";
    }

    if (result.eventType === "DEAL_CLOSED") {
      return "No earlier booking token was found for this deal. Verify the supporting booking before approving it.";
    }

    return "Possible duplicate or unsupported manual activity. Review the entry details with the agent.";
  }

  return (
    <div className="app">
      <aside className="sidebar" aria-label="Primary navigation">
        <a className="brand" href="#analytics" onClick={() => setActiveNav("analytics")}>
          <span className="brand-mark">L</span><span>Lyka <b>One</b></span>
        </a>
        <p className="nav-label">Workspace</p>
        <nav className="sidebar-nav">
          {[["leaderboard", "Leaderboard"], ["analytics", "Analytics"], ["event-ledger", "Event Ledger"], ["reconciliation", "Reconciliation"], ["anti-gaming", "Anti-Gaming"]].map(([id, label]) => (
            <a key={id} href={`#${id}`} className={activeNav === id ? "nav-item active" : "nav-item"} aria-current={activeNav === id ? "page" : undefined} onClick={() => setActiveNav(id)}>
              {label}
            </a>
          ))}
        </nav>
        <div className="sidebar-footer"><span className="status-dot" /> Live scoring</div>
      </aside>
      <div className="dashboard">
      <header className="header">
        <div>
          <p className="eyebrow">Performance workspace</p>
          <h1>Sales Performance</h1>
          <p>Monitor team activity, points, and data quality.</p>
        </div>

        <button
          onClick={() => setRecomputeKey((key) => key + 1)}
        >
          Recompute
        </button>
      </header>

      <main>
        {/* Main Summary */}
        <section className="summary" id="analytics">
          <SpotlightCard className="summary-stat">
            <span>Events</span>
            <strong>{ledger.length}</strong>
          </SpotlightCard>

          <SpotlightCard className="summary-stat">
            <span>Agents</span>
            <strong>{roster.length}</strong>
          </SpotlightCard>

          <SpotlightCard className="summary-stat">
            <span>Season</span>
            <strong>August 2026</strong>
          </SpotlightCard>
        </section>

        {/* Leaderboard */}
        <section id="leaderboard">
          <h2>Leaderboard</h2>
          <LeaderboardRows
            leaderboard={leaderboard}
            flaggedEventCount={results.filter((result) => result.flagged).length}
          />
        </section>

        {/* Event Ledger */}
        <section className="ledger-section" id="event-ledger">
          <h2>Event Ledger</h2>

          <p className="section-description">
            Every ledger event and its scoring outcome.
          </p>

          <div className="summary">
            <SpotlightCard className="summary-stat">
              <span>Counted</span>
              <strong>{displayBucketCounts.counted}</strong>
            </SpotlightCard>

            <SpotlightCard className="summary-stat">
              <span>Flagged</span>
              <strong>{displayBucketCounts.flagged}</strong>
            </SpotlightCard>

            <SpotlightCard className="summary-stat">
              <span>Capped</span>
              <strong>{displayBucketCounts.capped}</strong>
            </SpotlightCard>

            <SpotlightCard className="summary-stat">
              <span>Excluded</span>
              <strong>{displayBucketCounts.excluded}</strong>
            </SpotlightCard>

            <SpotlightCard className="summary-stat">
              <span>Rejected</span>
              <strong>{displayBucketCounts.rejected}</strong>
            </SpotlightCard>
          </div>

          <h3 className="accordion-heading">Guidelines</h3>
          <Accordion
            items={[
              { title: "Counted", content: "This event happened during the season and earned points normally.", icon: "✓", bgColor: "#dcfce7", textColor: "#166534" },
              { title: "Flagged", content: "This event looks suspicious (e.g. a duplicate-looking entry or a deal with no booking token) but still counts — a manager should review it.", icon: "⚑", bgColor: "#fef3c7", textColor: "#92400e" },
              { title: "Capped", content: "This is an extra same-day entry of a once-per-day activity (TEAM_PLANNING or DATA_UPLOAD) — it scores zero but stays in the ledger.", icon: "⇞", bgColor: "#fee2e2", textColor: "#991b1b" },
              { title: "Excluded", content: "This event happened outside the season window, so it doesn't count toward this leaderboard.", icon: "⊘", bgColor: "#f3f4f6", textColor: "#4b5563" },
              { title: "Rejected", content: "This event is for an agent who isn't on the roster, so it can't be attributed to anyone.", icon: "✕", bgColor: "#f3f4f6", textColor: "#4b5563" },
            ]}
          />

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
                {results.map((result) => {
                  const event = ledger.find(
                    (ledgerEvent) => ledgerEvent.eventId === result.eventId,
                  );
                  const occurredAt = event?.occurredAt;
                  const formattedOccurredAt = occurredAt
                    ? formatOccurredAt(occurredAt)
                    : null;

                  return (
                  <tr
                    key={`${result.eventId}-${result.agentId}-${result.eventType}`}
                    className={result.flagged ? "flagged-row" : ""}
                  >
                    <td>
                      <span className="event-id">{result.eventId}</span>
                    </td>

                    <td>
                      <strong>
                        {agentNames.get(result.agentId) ?? "Unknown"}
                      </strong>
                      <small>{result.agentId}</small>
                    </td>

                    <td>{result.eventType}</td>

                    <td>
                      {formattedOccurredAt ? (
                        <>
                          <span>{formattedOccurredAt.date}</span>
                          <small>{formattedOccurredAt.time}</small>
                        </>
                      ) : "-"}
                    </td>

                    <td>
                      {event?.source ?? "-"}
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
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Reconciliation */}
        <section className="reconciliation-section ledger-section" id="reconciliation">
          <h2>Reconciliation</h2>

          <p className="section-description">
            Compare engine totals against legacy dashboards.
          </p>

          {/* Reconciliation Summary */}
          <div className="summary">
            <SpotlightCard className="summary-stat">
              <span>Total Agents</span>
              <strong>
                {reconciliationSummary.totalAgents}
              </strong>
            </SpotlightCard>

            <SpotlightCard className="summary-stat">
              <span>Matching</span>
              <strong>
                {reconciliationSummary.matchingAgents}
              </strong>
            </SpotlightCard>

            <SpotlightCard className="summary-stat">
              <span>Mismatching</span>
              <strong>
                {reconciliationSummary.mismatchingAgents}
              </strong>
            </SpotlightCard>

            <SpotlightCard className="summary-stat">
              <span>Dashboard A Issues</span>
              <strong>
                {reconciliationSummary.dashboardAMismatches}
              </strong>
            </SpotlightCard>

            <SpotlightCard className="summary-stat">
              <span>Dashboard B Issues</span>
              <strong>
                {reconciliationSummary.dashboardBMismatches}
              </strong>
            </SpotlightCard>

            <SpotlightCard className="summary-stat">
              <span>Dashboard D Issues</span>
              <strong>
                {reconciliationSummary.dashboardDMismatches}
              </strong>
            </SpotlightCard>
          </div>

          {/* Reconciliation Table */}
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Agent</th>
                  <th>Engine</th>
                  <th>Dashboard A</th>
                  <th>Dashboard B</th>
                  <th>Dashboard D</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {reconciliationRows.map((row) => (
                  <tr key={row.agentId}>
                    <td>
                      <strong>{row.agentName}</strong>
                      <small>{row.agentId}</small>
                    </td>

                    <td>
                      <strong>{row.engineTotal}</strong>
                    </td>

                    <td>
                      {row.dashboardA}
                      <small>Δ {row.deltaA}</small>
                    </td>

                    <td>
                      {row.dashboardB}
                      <small>Δ {row.deltaB}</small>
                    </td>

                    <td>
                      {row.dashboardD}
                      <small>Δ {row.deltaD}</small>
                    </td>

                    <td>
  <div>
    <span
      className={`status status-${row.statusA.toLowerCase()}`}
    >
      A: {row.statusA}
    </span>

    <span
      className={`status status-${row.statusB.toLowerCase()}`}
    >
      B: {row.statusB}
    </span>

    <span
      className={`status status-${row.statusD.toLowerCase()}`}
    >
      D: {row.statusD}
    </span>
  </div>

  {(row.reasons.dashboardA.length > 0 ||
    row.reasons.dashboardB.length > 0 ||
    row.reasons.dashboardD.length > 0) && (
    <div className="reconciliation-reasons">
      {row.reasons.dashboardA.map((reason) => (
        <small key={`a-${reason}`}>A: {reason}</small>
      ))}

      {row.reasons.dashboardB.map((reason) => (
        <small key={`b-${reason}`}>B: {reason}</small>
      ))}

      {row.reasons.dashboardD.map((reason) => (
        <small key={`d-${reason}`}>D: {reason}</small>
      ))}
    </div>
  )}
</td>
                    
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Anti-Gaming Panel */}
        <section className="ledger-section" id="anti-gaming">
          <h2>Anti-Gaming Panel</h2>

          <p className="section-description">
            Events that need a manager review before they are relied on for performance decisions.
          </p>

          {[...flaggedEventsByAgent.entries()].map(
            ([agentId, flaggedEvents]) => (
              <div key={agentId}>
                <h3>
                  {agentNames.get(agentId) ?? "Unknown agent"} ({agentId}) — {flaggedEvents.length} flagged event{flaggedEvents.length === 1 ? "" : "s"}
                </h3>

                <div className="table-container">
                  <table className="ledger-table">
                    <thead>
                      <tr>
                        <th>Event ID</th>
                        <th>Event Type</th>
                        <th>Occurred At</th>
                        <th>Status</th>
                        <th>Manager Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {flaggedEvents.map((result) => {
                        const formattedOccurredAt = formatOccurredAt(result.occurredAt);

                        return (
                        <tr key={`${result.eventId}-${result.occurredAt}`} className="flagged-row">
                          <td><span className="event-id">{result.eventId}</span></td>
                          <td>{result.eventType}</td>
                          <td>
                            <span>{formattedOccurredAt.date}</span>
                            <small>{formattedOccurredAt.time}</small>
                          </td>
                          <td>
                            <span className={`status status-${result.status.toLowerCase()}`}>
                              {result.status}
                            </span>
                          </td>
                          <td>
                            <span className="reason">{getManagerFlagReason(result)}</span>
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ),
          )}
        </section>
      </main>
      </div>
    </div>
  );
}

export default App;
