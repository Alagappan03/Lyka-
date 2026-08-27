import { describe, expect, test } from "vitest";

import {
  reconcile,
  summarizeReconciliation,
} from "./reconciliation";

import { ledger } from "../data/ledger";
import type { Agent } from "./types";

const roster: Agent[] = [
  { agentId: "AG-01", name: "Ravi Kumar" },
  { agentId: "AG-02", name: "Priya Menon" },
  { agentId: "AG-03", name: "Bikash Thapa" },
  { agentId: "AG-04", name: "Deepa Reddy" },
  { agentId: "AG-05", name: "Anand Raj" },
];

const engineTotals = new Map<string, number>([
  ["AG-01", 65],
  ["AG-02", 30],
  ["AG-03", 60],
  ["AG-04", 25],
  ["AG-05", 30],
]);

describe("Reconciliation", () => {
  test("compares engine totals with legacy dashboards", () => {
    const rows = reconcile(ledger, roster, engineTotals);

    expect(rows).toHaveLength(5);

    expect(rows[0]).toMatchObject({
      agentId: "AG-01",
      agentName: "Ravi Kumar",
      engineTotal: 65,
      dashboardA: 90,
      dashboardB: 90,
      dashboardD: 90,
    });

    expect(rows[1]).toMatchObject({
      agentId: "AG-02",
      agentName: "Priya Menon",
      engineTotal: 30,
      dashboardA: 50,
      dashboardB: 50,
      dashboardD: 45,
    });

    expect(rows[2]).toMatchObject({
      agentId: "AG-03",
      agentName: "Bikash Thapa",
      engineTotal: 60,
      dashboardA: 60,
      dashboardB: 60,
      dashboardD: 60,
    });

    expect(rows[3]).toMatchObject({
      agentId: "AG-04",
      agentName: "Deepa Reddy",
      engineTotal: 25,
      dashboardA: 35,
      dashboardB: 35,
      dashboardD: 52,
    });

    expect(rows[4]).toMatchObject({
      agentId: "AG-05",
      agentName: "Anand Raj",
      engineTotal: 30,
      dashboardA: 30,
      dashboardB: 30,
      dashboardD: 30,
    });

    expect(rows[0]).toMatchObject({
  deltaA: 25,
  deltaB: 25,
  deltaD: 25,
});

expect(rows[1]).toMatchObject({
  deltaA: 20,
  deltaB: 20,
  deltaD: 15,
});

expect(rows[2]).toMatchObject({
  deltaA: 0,
  deltaB: 0,
  deltaD: 0,
});

expect(rows[3]).toMatchObject({
  deltaA: 10,
  deltaB: 10,
  deltaD: 27,
});

expect(rows[4]).toMatchObject({
  deltaA: 0,
  deltaB: 0,
  deltaD: 0,
});

expect(rows[0]).toMatchObject({
  statusA: "MISMATCH",
  statusB: "MISMATCH",
  statusD: "MISMATCH",
});

expect(rows[1]).toMatchObject({
  statusA: "MISMATCH",
  statusB: "MISMATCH",
  statusD: "MISMATCH",
});

expect(rows[2]).toMatchObject({
  statusA: "MATCH",
  statusB: "MATCH",
  statusD: "MATCH",
});

expect(rows[3]).toMatchObject({
  statusA: "MISMATCH",
  statusB: "MISMATCH",
  statusD: "MISMATCH",
});

expect(rows[4]).toMatchObject({
  statusA: "MATCH",
  statusB: "MATCH",
  statusD: "MATCH",
});

});

test("summarizes reconciliation mismatches", () => {
  const rows = reconcile(ledger, roster, engineTotals);

  const summary = summarizeReconciliation(rows);

  expect(summary).toEqual({
    totalAgents: 5,
    matchingAgents: 2,
    mismatchingAgents: 3,
    dashboardAMismatches: 3,
    dashboardBMismatches: 3,
    dashboardDMismatches: 3,
  });
});
  });


  test("explains the important reconciliation differences", () => {
    const rows = reconcile(ledger, roster, engineTotals);

    const priya = rows.find(
      (row) => row.agentId === "AG-02",
    );

    const deepa = rows.find(
      (row) => row.agentId === "AG-04",
    );

    expect(priya?.reasons.dashboardA).toEqual(
      expect.arrayContaining([
        expect.stringContaining("e05"),
      ]),
    );

    expect(priya?.reasons.dashboardB).toEqual(
        expect.arrayContaining([
            expect.stringContaining("e05"),
      ]),
    );

    expect(deepa?.reasons.dashboardD).toEqual(
      expect.arrayContaining([
        expect.stringContaining("e16"),
        expect.stringContaining("e30"),
      ]),
    );
  });
