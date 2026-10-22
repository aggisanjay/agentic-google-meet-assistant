/**
 * Typed Source Provenance Schema
 * Every scheduling answer, recommendation, and completed action must record traceable evidence.
 */

export type SourceType =
  | "calendar_api"
  | "freebusy_api"
  | "user_instruction"
  | "user_preference"
  | "calculated"
  | "inferred";

export type VerificationStatus =
  | "verified_calendar_fact"
  | "calculated_result"
  | "ai_recommendation"
  | "unverified_assumption"
  | "failed_retrieval";

export type OperationStatus =
  | "success"
  | "pending_confirmation"
  | "failed"
  | "uncertain";

export type SourceProvenance = {
  sourceType: SourceType;
  verificationStatus: VerificationStatus;
  calendarId: string;
  retrievalTimestamp: string;
  toolName: string;
  eventId?: string | null;
  start?: string | null;
  end?: string | null;
  timezone?: string;
  queryRange?: {
    timeMin: string;
    timeMax?: string;
  };
  evidenceSummary: string;
  conflictsDetected?: number;
  operationStatus: OperationStatus;
  traceId?: string;
  idempotencyKey?: string;
};

export type CalendarEventItem = {
  id: string | null;
  title: string;
  description: string | null;
  location: string | null;
  start: string | null;
  end: string | null;
  htmlLink: string | null;
  meetLink: string | null;
  accountEmail: string | null;
  attendees: string[];
  provenance?: SourceProvenance;
};
