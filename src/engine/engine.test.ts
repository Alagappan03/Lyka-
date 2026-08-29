import type { Event } from "./types";
import { getPoints, isInSeason, isSuspiciousManualEvent, literalR7Points } from "./rules";
import { describe, expect, test } from "vitest";
import { ledger } from "../data/ledger";
import { roster } from "../data/roster";
import { getDisplayBucket, scoreEvents, type DisplayBucket } from "./scoring";
import { calculateAgentTotals } from "./totals";
import { buildLeaderboard } from "./leaderboard";
import { pointConfigHistory } from "../data/config";

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

  test("R7's literal current-config reading gives Bikash Thapa 75 points, versus 60 under A2 point-in-time scoring", () => {
    const bikashSeasonEvents = ledger.filter(
      (event) => event.agentId === "AG-03" && isInSeason(event),
    );
    const latestConfig = pointConfigHistory.at(-1);

    expect(latestConfig).toBeDefined();

    const pointInTimeTotal = bikashSeasonEvents.reduce(
      (total, event) => total + getPoints(event.type, event.occurredAt),
      0,
    );
    const literalR7Total = bikashSeasonEvents.reduce(
      (total, event) => total + literalR7Points(event.type, latestConfig!),
      0,
    );

    expect(pointInTimeTotal).toBe(60);
    expect(literalR7Total).toBe(75);
  });

  test("the five display buckets account for every ledger event", () => {
    const buckets: Record<DisplayBucket, number> = {
      counted: 0,
      flagged: 0,
      capped: 0,
      excluded: 0,
      rejected: 0,
    };

    scoreEvents(ledger, roster).forEach((result) => {
      buckets[getDisplayBucket(result)] += 1;
    });

    expect(Object.values(buckets).reduce((total, count) => total + count, 0))
      .toBe(27);
    expect(Object.values(buckets).reduce((total, count) => total + count, 0))
      .toBe(ledger.length);
  });
});
