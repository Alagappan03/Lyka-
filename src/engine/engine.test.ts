import type { Event } from "./types";
import { isSuspiciousManualEvent } from "./rules";
import { describe, expect, test } from "vitest";
import { ledger } from "../data/ledger";
import { roster } from "../data/roster";
import { scoreEvents } from "./scoring";
import { calculateAgentTotals } from "./totals";
import { buildLeaderboard } from "./leaderboard";
import { getPoints } from "./rules";

function calculateLeaderboard() {
  const results = scoreEvents(ledger, roster);
  const totals = calculateAgentTotals(results, roster);

  return buildLeaderboard(totals, roster);
}

describe("Scoring Engine", () => {

  test("flags a manual DEAL_CLOSED without a previous BOOKING_TOKEN", () => {
  const events: Event[] = [
    {
      eventId: "TEST-001",
      agentId: "AG-01",
      type: "DEAL_CLOSED",
      occurredAt: "2026-08-20T10:00:00",
      recordedAt: "2026-08-20T10:01:00",
      source: "manual",
    },
  ];

  expect(isSuspiciousManualEvent(events[0], events)).toBe(true);
  });

test("does not flag a manual DEAL_CLOSED when a previous BOOKING_TOKEN exists", () => {
  const events: Event[] = [
    {
      eventId: "TEST-002",
      agentId: "AG-01",
      type: "BOOKING_TOKEN",
      occurredAt: "2026-08-20T09:00:00",
      recordedAt: "2026-08-20T09:01:00",
      source: "auto",
    },
    {
      eventId: "TEST-003",
      agentId: "AG-01",
      type: "DEAL_CLOSED",
      occurredAt: "2026-08-20T10:00:00",
      recordedAt: "2026-08-20T10:01:00",
      source: "manual",
    },
  ];

  expect(isSuspiciousManualEvent(events[1], events)).toBe(false);
  });

  test("recomputation produces identical leaderboard", () => {
    const firstRun = calculateLeaderboard();
    const secondRun = calculateLeaderboard();

    expect(firstRun).toEqual(secondRun);
  });

  test("leaderboard contains all 5 agents", () => {
    const leaderboard = calculateLeaderboard();

    expect(leaderboard).toHaveLength(5);
  });

  test("Ravi Kumar ranks first with 65 points", () => {
  const leaderboard = calculateLeaderboard();

  expect(leaderboard[0].name).toBe("Ravi Kumar");
  expect(leaderboard[0].totalPoints).toBe(65);
  expect(leaderboard[0].rank).toBe(1);
  });

  test("ties are resolved using roster order", () => {
  const leaderboard = calculateLeaderboard();

  const priya = leaderboard.find(
    (agent) => agent.name === "Priya Menon",
  );

  const anand = leaderboard.find(
    (agent) => agent.name === "Anand Raj",
  );

  expect(priya).toBeDefined();
  expect(anand).toBeDefined();

  expect(priya!.totalPoints).toBe(30);
  expect(anand!.totalPoints).toBe(30);

  expect(priya!.rank).toBeLessThan(anand!.rank);
  });

  test("DEAL_CLOSED uses 20 points before Aug 15", () => {
    expect(
      getPoints("DEAL_CLOSED", "2026-08-10T10:00:00"),
    ).toBe(20);
  });

  test("DEAL_CLOSED uses 25 points from Aug 15 onward", () => {
    expect(
      getPoints("DEAL_CLOSED", "2026-08-20T10:00:00"),
    ).toBe(25);
  });
});