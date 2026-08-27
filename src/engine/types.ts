export type EventType =
  | "DEAL_CLOSED"
  | "BOOKING_TOKEN"
  | "MEETING_INPERSON"
  | "ONTIME_ENTRY"
  | "GOOGLE_REVIEW"
  | "TEAM_PLANNING"
  | "MEETING_VIDEO"
  | "DATA_UPLOAD";

export type EventSource = "auto" | "manual";

export type EventStatus =
  | "COUNTED"
  | "FLAGGED"
  | "CAPPED"
  | "EXCLUDED"
  | "REJECTED";

export interface Event {
  eventId: string;
  agentId: string;
  type: EventType;
  occurredAt: string;
  recordedAt: string;
  source: EventSource;
}

export interface Agent {
  agentId: string;
  name: string;
}

export interface ScoringResult {
  eventId: string;
  agentId: string;
  eventType: EventType;
  status: EventStatus;
  points: number;
  reason: string;
  flagged: boolean;
  flagReason?: string;
}