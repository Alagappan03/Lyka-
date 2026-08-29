import { useState } from "react";
import type { LeaderboardEntry } from "../engine/leaderboard";
import type { EventType } from "../engine/types";

const eventTypes: EventType[] = [
  "DEAL_CLOSED",
  "BOOKING_TOKEN",
  "MEETING_INPERSON",
  "ONTIME_ENTRY",
  "GOOGLE_REVIEW",
  "TEAM_PLANNING",
  "MEETING_VIDEO",
  "DATA_UPLOAD",
];

const eventTypeColors: Record<EventType, string> = {
  DEAL_CLOSED: "#6d5dfc",
  BOOKING_TOKEN: "#14b8a6",
  MEETING_INPERSON: "#3b82f6",
  ONTIME_ENTRY: "#f59e0b",
  GOOGLE_REVIEW: "#ec4899",
  TEAM_PLANNING: "#8b5cf6",
  MEETING_VIDEO: "#06b6d4",
  DATA_UPLOAD: "#84cc16",
};

type LeaderboardRowsProps = {
  leaderboard: LeaderboardEntry[];
  flaggedEventCount: number;
};

type TooltipState = {
  agent: LeaderboardEntry;
  x: number;
  y: number;
};

function rankClass(rank: number) {
  if (rank === 1) return " rank-gold";
  if (rank === 2) return " rank-silver";
  if (rank === 3) return " rank-bronze";
  return "";
}

export function LeaderboardRows({
  leaderboard,
  flaggedEventCount,
}: LeaderboardRowsProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const topScore = leaderboard[0]?.totalPoints ?? 0;
  const seasonPoints = leaderboard.reduce(
    (total, agent) => total + agent.totalPoints,
    0,
  );

  return (
    <>
      <div className="leaderboard-metrics">
        <div className="leaderboard-metric">
          <span>Top performer</span>
          <strong>{leaderboard[0]?.name ?? "—"}</strong>
          <small>{leaderboard[0]?.totalPoints ?? 0} pts</small>
        </div>
        <div className="leaderboard-metric">
          <span>Season points</span>
          <strong>{seasonPoints}</strong>
        </div>
        <div className="leaderboard-metric leaderboard-metric-warning">
          <span>Flagged events</span>
          <strong>{flaggedEventCount}</strong>
        </div>
      </div>

      <div className="leaderboard-rows">
        {leaderboard.map((agent) => (
          <div className="leaderboard-row" key={agent.agentId}>
            <span className={`rank-badge${rankClass(agent.rank)}`}>
              {agent.rank}
            </span>
            <strong className="leaderboard-agent-name">{agent.name}</strong>
            <div
              className="leaderboard-composition"
              aria-label={`${agent.name}'s event point breakdown`}
              onMouseEnter={(event) =>
                setTooltip({ agent, x: event.clientX, y: event.clientY })
              }
              onMouseMove={(event) =>
                setTooltip({ agent, x: event.clientX, y: event.clientY })
              }
              onMouseLeave={() => setTooltip(null)}
            >
              {eventTypes.map((eventType) => {
                const points = agent.breakdown[eventType] ?? 0;

                if (points <= 0 || topScore <= 0) return null;

                return (
                  <span
                    className="leaderboard-composition-segment"
                    key={eventType}
                    style={{
                      backgroundColor: eventTypeColors[eventType],
                      flexBasis: `${(points / topScore) * 100}%`,
                    }}
                  />
                );
              })}
            </div>
            <strong className="leaderboard-total-points">{agent.totalPoints}</strong>
          </div>
        ))}
      </div>

      {tooltip && (
        <div
          className="leaderboard-tooltip"
          role="tooltip"
          style={{ left: tooltip.x + 14, top: tooltip.y + 14 }}
        >
          <strong>{tooltip.agent.name}</strong>
          {eventTypes.map((eventType) => (
            <div className="leaderboard-tooltip-item" key={eventType}>
              <span
                className="leaderboard-tooltip-dot"
                style={{ backgroundColor: eventTypeColors[eventType] }}
              />
              {eventType}: {tooltip.agent.breakdown[eventType] ?? 0} pts
            </div>
          ))}
        </div>
      )}
    </>
  );
}
