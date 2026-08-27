import type { Agent, Event } from "./types";
import { getPoints, isInSeason } from "./rules";

export type ReconciliationStatus =
  | "MATCH"
  | "MISMATCH";

export interface ReconciliationRow {
  agentId: string;
  agentName: string;
  engineTotal: number;
  dashboardA: number;
  dashboardB: number;
  dashboardD: number;
 
  deltaA: number;
  deltaB: number;
  deltaD: number;
  
  statusA: ReconciliationStatus;
  statusB: ReconciliationStatus;
  statusD: ReconciliationStatus;
  
  reasons: {
    dashboardA: string[];
    dashboardB: string[];
    dashboardD: string[];
  };
}

function calculatePoints(
  event: Event,
  manualMultiplier = 1,
): number {
  return getPoints(event.type, event.occurredAt) * manualMultiplier;
}

// Dashboard A:
// Sums every event ever recorded.
// No season window.
function calculateDashboardA(
  events: readonly Event[],
  agentId: string,
): number {
  return events
    .filter((event) => event.agentId === agentId)
    .reduce((total, event) => total + calculatePoints(event), 0);
}

// Dashboard B:
// Uses recordedAt instead of occurredAt for season membership.
function calculateDashboardB(
  events: readonly Event[],
  agentId: string,
): number {
  return events
    .filter(
      (event) =>
        event.agentId === agentId &&
        event.recordedAt >= "2026-08-01T00:00:00" &&
        event.recordedAt <= "2026-08-31T23:59:59",
    )
    .reduce((total, event) => total + calculatePoints(event), 0);
}

// Dashboard D:
// Correct season window, but manual events receive double points.
function calculateDashboardD(
  events: readonly Event[],
  agentId: string,
): number {
  return events
    .filter(
      (event) =>
        event.agentId === agentId &&
        isInSeason(event),
    )
    .reduce(
      (total, event) =>
        total +
        calculatePoints(
          event,
          event.source === "manual" ? 2 : 1,
        ),
      0,
    );
}

function getDifferenceReasons(
  events: readonly Event[],
  agentId: string,
): ReconciliationRow["reasons"] {
  const agentEvents = events.filter(
    (event) => event.agentId === agentId,
  );

  const dashboardAReasons: string[] = [];
  const dashboardBReasons: string[] = [];
  const dashboardDReasons: string[] = [];

  for (const event of agentEvents) {
    const points = calculatePoints(event);

    // Dashboard A has no season window.
    if (!isInSeason(event)) {
      dashboardAReasons.push(
        `${event.eventId}: occurred ${event.occurredAt.slice(0, 10)}, outside the season, but Dashboard A includes it (+${points}).`,
      );
    }

    // Dashboard B uses recordedAt instead of occurredAt.
    const occurredInSeason = isInSeason(event);
    const recordedInSeason =
      event.recordedAt >= "2026-08-01T00:00:00" &&
      event.recordedAt <= "2026-08-31T23:59:59";

    if (occurredInSeason !== recordedInSeason) {
      if (recordedInSeason) {
        dashboardBReasons.push(
          `${event.eventId}: occurred ${event.occurredAt.slice(0, 10)} but was recorded ${event.recordedAt.slice(0, 10)}, so Dashboard B includes it.`,
        );
      } else {
        dashboardBReasons.push(
          `${event.eventId}: occurred ${event.occurredAt.slice(0, 10)} but was recorded ${event.recordedAt.slice(0, 10)}, so Dashboard B excludes it.`,
        );
      }
    }

    // Dashboard D doubles manual events.
    if (event.source === "manual" && isInSeason(event)) {
      dashboardDReasons.push(
        `${event.eventId}: manual ${event.type} receives double points in Dashboard D (+${points}).`,
      );
    }
  }

  return {
    dashboardA: dashboardAReasons,
    dashboardB: dashboardBReasons,
    dashboardD: dashboardDReasons,
  };
}

export function reconcile(
  events: readonly Event[],
  roster: readonly Agent[],
  engineTotals: ReadonlyMap<string, number>,
): ReconciliationRow[] {
  return roster.map((agent) => {
  const engineTotal = engineTotals.get(agent.agentId) ?? 0;

  const dashboardA = calculateDashboardA(
    events,
    agent.agentId,
  );

  const dashboardB = calculateDashboardB(
    events,
    agent.agentId,
  );

  const dashboardD = calculateDashboardD(
    events,
    agent.agentId,
  );

  return {
    agentId: agent.agentId,
    agentName: agent.name,
    engineTotal,
    dashboardA,
    dashboardB,
    dashboardD,

    // Positive = legacy dashboard is higher
    // Negative = legacy dashboard is lower
    deltaA: dashboardA - engineTotal,
    deltaB: dashboardB - engineTotal,
    deltaD: dashboardD - engineTotal,

    statusA:
  dashboardA === engineTotal
    ? "MATCH"
    : "MISMATCH",

statusB:
  dashboardB === engineTotal
    ? "MATCH"
    : "MISMATCH",

statusD:
  dashboardD === engineTotal
    ? "MATCH"
    : "MISMATCH",

    reasons: getDifferenceReasons(
      events,
      agent.agentId,
    ),
  };
});
}
export interface ReconciliationSummary {
  totalAgents: number;
  matchingAgents: number;
  mismatchingAgents: number;
  dashboardAMismatches: number;
  dashboardBMismatches: number;
  dashboardDMismatches: number;
}

export function summarizeReconciliation(
  rows: readonly ReconciliationRow[],
): ReconciliationSummary {
  return {
    totalAgents: rows.length,

    matchingAgents: rows.filter(
      (row) =>
        row.statusA === "MATCH" &&
        row.statusB === "MATCH" &&
        row.statusD === "MATCH",
    ).length,

    mismatchingAgents: rows.filter(
      (row) =>
        row.statusA === "MISMATCH" ||
        row.statusB === "MISMATCH" ||
        row.statusD === "MISMATCH",
    ).length,

    dashboardAMismatches: rows.filter(
      (row) => row.statusA === "MISMATCH",
    ).length,

    dashboardBMismatches: rows.filter(
      (row) => row.statusB === "MISMATCH",
    ).length,

    dashboardDMismatches: rows.filter(
      (row) => row.statusD === "MISMATCH",
    ).length,
  };
}