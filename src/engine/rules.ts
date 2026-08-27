import type { Agent, Event, EventType } from "./types";
import { pointConfigHistory } from "../data/config";

export const SEASON_START = "2026-08-01T00:00:00";
export const SEASON_END = "2026-08-31T23:59:59";

export function isValidAgent(
  event: Event,
  roster: readonly Agent[],
): boolean {
  return roster.some((agent) => agent.agentId === event.agentId);
}

export function isInSeason(event: Event): boolean {
  return (
    event.occurredAt >= SEASON_START &&
    event.occurredAt <= SEASON_END
  );
}

export function isDailyLimitedEvent(event: Event): boolean {
  return (
    event.type === "DATA_UPLOAD" ||
    event.type === "TEAM_PLANNING"
  );
}

export function getDayKey(event: Event): string {
  return event.occurredAt.slice(0, 10);
}

export function isDuplicateEvent(
  event: Event,
  seenEventIds: ReadonlySet<string>,
): boolean {
  return seenEventIds.has(event.eventId);
}

export function isSuspiciousManualEvent(
  event: Event,
  events: readonly Event[],
): boolean {
  if (event.source !== "manual") {
    return false;
  }

  // R5: Exact duplicate manual activity
  const duplicateManualEvent = events.some(
    (otherEvent) =>
      otherEvent.eventId !== event.eventId &&
      otherEvent.agentId === event.agentId &&
      otherEvent.type === event.type &&
      otherEvent.occurredAt === event.occurredAt &&
      otherEvent.source === "manual",
  );

  if (duplicateManualEvent) {
    return true;
  }

  // R5: DEAL_CLOSED without a preceding BOOKING_TOKEN
  if (event.type === "DEAL_CLOSED") {
    const hasPreviousBookingToken = events.some(
      (otherEvent) =>
        otherEvent.eventId !== event.eventId &&
        otherEvent.agentId === event.agentId &&
        otherEvent.type === "BOOKING_TOKEN" &&
        otherEvent.occurredAt < event.occurredAt,
    );

    if (!hasPreviousBookingToken) {
      return true;
    }
  }

  return false;
}

export function isDailyLimitExceeded(
  event: Event,
  countedEvents: readonly Event[],
): boolean {
  if (!isDailyLimitedEvent(event)) {
    return false;
  }

  const day = getDayKey(event);

  return countedEvents.some(
    (countedEvent) =>
      countedEvent.agentId === event.agentId &&
      countedEvent.type === event.type &&
      getDayKey(countedEvent) === day,
  );
}

export function getPoints(
  eventType: EventType,
  occurredAt: string,
): number {
  let activeConfig = pointConfigHistory[0];

  for (const config of pointConfigHistory) {
    if (occurredAt >= config.effectiveFrom) {
      activeConfig = config;
    } else {
      break;
    }
  }

  return activeConfig.points[eventType];
}