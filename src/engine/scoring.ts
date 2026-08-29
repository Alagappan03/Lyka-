import type { Agent, Event, ScoringResult } from "./types";
import {
  getPoints,
  isDailyLimitExceeded,
  isDuplicateEvent,
  isInSeason,
  isSuspiciousManualEvent,
  isValidAgent,
} from "./rules";

export type DisplayBucket =
  | "counted"
  | "flagged"
  | "capped"
  | "excluded"
  | "rejected";

export function getDisplayBucket(result: ScoringResult): DisplayBucket {
  if (result.flagged) {
    return "flagged";
  }

  return result.status.toLowerCase() as DisplayBucket;
}

export function scoreEvents(
  events: readonly Event[],
  roster: readonly Agent[],
): ScoringResult[] {
  const results: ScoringResult[] = [];
  const seenEventIds = new Set<string>();
  const countedEvents: Event[] = [];

  for (const event of events) {
    // R8: Unknown agent
    if (!isValidAgent(event, roster)) {
      results.push({
        eventId: event.eventId,
        agentId: event.agentId,
        eventType: event.type,
        status: "REJECTED",
        points: 0,
        reason: `Agent ${event.agentId} is not on the current roster. No points awarded.`,
        flagged: false,
      });

      continue;
    }

    // R1 + R2: Event must have occurred during the season
    if (!isInSeason(event)) {
      results.push({
        eventId: event.eventId,
        agentId: event.agentId,
        eventType: event.type,
        status: "EXCLUDED",
        points: 0,
        reason: "Event occurred outside the active season (August 1–31, 2026). No points awarded.",
        flagged: false,
      });

      continue;
    }

    // R4: Duplicate event
    if (isDuplicateEvent(event, seenEventIds)) {
      results.push({
        eventId: event.eventId,
        agentId: event.agentId,
        eventType: event.type,
        status: "REJECTED",
        points: 0,
        reason: "Duplicate event ID. This event was already processed, so no additional points were awarded.",
        flagged: false,
      });

      continue;
    }

    seenEventIds.add(event.eventId);

    // R6: Daily limit
    if (isDailyLimitExceeded(event, countedEvents)) {
      results.push({
        eventId: event.eventId,
        agentId: event.agentId,
        eventType: event.type,
        status: "CAPPED",
        points: 0,
        reason: "Daily limit already reached for this agent and event type. No additional points awarded today.",
        flagged: true,
        flagReason: "Daily cap hit: additional entries for this agent and event type on the same day score zero.",
      });

      continue;
    }

    const points = getPoints(event.type, event.occurredAt);// Valid event
    const suspicious = isSuspiciousManualEvent(event, events);

    results.push({
      eventId: event.eventId,
      agentId: event.agentId,
      eventType: event.type,
      status: "COUNTED",
      points,
      reason: suspicious
        ? "Event counted, but suspicious manual activity was detected. Review this event."
        : "Event is valid and counted.",
      flagged: suspicious,
      flagReason: suspicious
        ? "Manual activity matched a suspicious pattern. Review for duplicate or unsupported activity."
        : undefined,
    });

    countedEvents.push(event);
  }

  if (results.length !== events.length) {
    throw new Error(
      `Scoring error: expected ${events.length} results, but got ${results.length}`,
    );
  }

  return results;
}
