import type { Agent, EventType, ScoringResult } from "./types";

export interface AgentTotal {
  agentId: string;
  name: string;
  totalPoints: number;
  breakdown: Record<EventType, number>;
}

export function calculateAgentTotals(
  results: readonly ScoringResult[],
  roster: readonly Agent[],
): AgentTotal[] {
  return roster.map((agent) => {
    const agentResults = results.filter(
      (result) =>
        result.agentId === agent.agentId &&
        result.status === "COUNTED",
    );

    const breakdown = {} as Record<EventType, number>;

    for (const result of agentResults) {
      breakdown[result.eventType] =
        (breakdown[result.eventType] ?? 0) + result.points;
    }

    const totalPoints = agentResults.reduce(
      (total, result) => total + result.points,
      0,
    );

    return {
      agentId: agent.agentId,
      name: agent.name,
      totalPoints,
      breakdown,
    };
  });
}