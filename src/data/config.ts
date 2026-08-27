import type { EventType } from "../engine/types";

export interface PointConfig {
  effectiveFrom: string;
  points: Record<EventType, number>;
}

export const pointConfigHistory: readonly PointConfig[] = [
  {
    effectiveFrom: "2026-08-01T00:00:00+04:00",
    points: {
      DEAL_CLOSED: 20,
      BOOKING_TOKEN: 10,
      MEETING_INPERSON: 5,
      ONTIME_ENTRY: 5,
      GOOGLE_REVIEW: 5,
      TEAM_PLANNING: 5,
      MEETING_VIDEO: 3,
      DATA_UPLOAD: 2,
    },
  },
  {
    effectiveFrom: "2026-08-15T00:00:00+04:00",
    points: {
      DEAL_CLOSED: 25,
      BOOKING_TOKEN: 10,
      MEETING_INPERSON: 5,
      ONTIME_ENTRY: 5,
      GOOGLE_REVIEW: 5,
      TEAM_PLANNING: 5,
      MEETING_VIDEO: 3,
      DATA_UPLOAD: 2,
    },
  },
];