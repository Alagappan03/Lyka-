import type { Agent } from "./types";
import type { AgentTotal } from "./totals";

export interface LeaderboardEntry extends AgentTotal {
  rank: number;
}

export function buildLeaderboard(
  totals: readonly AgentTotal[],
  roster: readonly Agent[],
): LeaderboardEntry[] {
  const agentOrder = new Map(
    roster.map((agent, index) => [agent.agentId, index]),
  );

  return [...totals]
    .sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) {
        return b.totalPoints - a.totalPoints;
      }

      return (
        (agentOrder.get(a.agentId) ?? Number.MAX_SAFE_INTEGER) -
        (agentOrder.get(b.agentId) ?? Number.MAX_SAFE_INTEGER)
      );
    })
    .map((agent, index) => ({
      ...agent,
      rank: index + 1,
    }));
}