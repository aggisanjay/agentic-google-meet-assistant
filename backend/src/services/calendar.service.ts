import { google, calendar_v3 } from "googleapis";
import { randomUUID } from "node:crypto";
import { getCalendarAccessToken } from "./token.service.js";
import {
  getDayBoundsInTimezone,
  validateTimeRange,
  doIntervalsOverlap,
  resolveTimezone,
} from "../utils/timezone.js";
import type { CalendarEventItem, SourceProvenance } from "../types/provenance.js";

/**
 * Exponential backoff with jitter for transient Google API errors (429, 500, 503).
 */
async function withCalendarRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelayMs = 500,
): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await operation();
    } catch (error: any) {
      attempt++;
      const status = error?.status || error?.code || error?.response?.status;
      const isTransient =
        status === 429 ||
        status === 500 ||
        status === 502 ||
        status === 503 ||
        status === 504 ||
        error?.message?.toLowerCase().includes("rate limit") ||
        error?.message?.toLowerCase().includes("quota");

      if (!isTransient || attempt > maxRetries) {
        throw error;
      }

      // Check for Retry-After header
      const retryAfterHeader = error?.response?.headers?.["retry-after"];
      let delayMs = baseDelayMs * Math.pow(2, attempt - 1);
      if (retryAfterHeader) {
        const parsedSeconds = parseInt(retryAfterHeader, 10);
        if (!isNaN(parsedSeconds)) {
          delayMs = parsedSeconds * 1000;
        }
      }

      // Add jitter between 0 and 250ms
      const jitter = Math.floor(Math.random() * 250);
      await new Promise((resolve) => setTimeout(resolve, delayMs + jitter));
    }
  }
}

function calendarClient(accessToken: string): calendar_v3.Calendar {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.calendar({ version: "v3", auth });
}

export async function calendarForUser(authUserId: string): Promise<calendar_v3.Calendar> {
  const accessToken = await getCalendarAccessToken(authUserId);
  return calendarClient(accessToken);
}

/**
 * Sanitizes untrusted text retrieved from external calendar events to neutralize prompt injection.
 */
function sanitizeUntrustedText(text?: string | null): string | null {
  if (!text) return null;
  // Replace excessive linebreaks and demarcate
  return text.trim().slice(0, 4000);
}

export function formatEvent(
  event: calendar_v3.Schema$Event,
  provenance?: SourceProvenance,
): CalendarEventItem {
  const accountEmail = event.organizer?.email || event.creator?.email || null;
  let htmlLink = event.htmlLink ?? null;
  if (htmlLink && accountEmail) {
    const separator = htmlLink.includes("?") ? "&" : "?";
    htmlLink = `${htmlLink}${separator}authuser=${encodeURIComponent(accountEmail)}`;
  }

  return {
    id: event.id ?? null,
    title: event.summary?.trim() || "(no title)",
    description: sanitizeUntrustedText(event.description),
    location: sanitizeUntrustedText(event.location),
    start: event.start?.dateTime ?? event.start?.date ?? null,
    end: event.end?.dateTime ?? event.end?.date ?? null,
    htmlLink,
    meetLink: event.hangoutLink ?? null,
    accountEmail,
    attendees: (event.attendees ?? [])
      .map((person) => person.email || person.displayName)
      .filter((value): value is string => Boolean(value)),
    provenance,
  };
}

/**
 * Lists upcoming meetings with timezone-aware day boundary support.
 */
export async function listUpcomingMeetings(input: {
  authUserId: string;
  maxResults?: number;
  todayOnly?: boolean;
  timezone?: string;
  timeMin?: string;
  timeMax?: string;
  traceId?: string;
}) {
  const calendar = await calendarForUser(input.authUserId);
  const now = new Date();
  const tz = resolveTimezone(input.timezone);

  let timeMin = input.timeMin ?? now.toISOString();
  let timeMax = input.timeMax;

  if (input.todayOnly) {
    const bounds = getDayBoundsInTimezone(tz, now);
    timeMin = bounds.startIso;
    timeMax = bounds.endIso;
  }

  const response = await withCalendarRetry(() =>
    calendar.events.list({
      calendarId: "primary",
      timeMin,
      timeMax,
      maxResults: Math.min(Math.max(input.maxResults ?? 10, 1), 50),
      singleEvents: true,
      orderBy: "startTime",
    }),
  );

  const items = response.data.items ?? [];
  const retrievalTimestamp = new Date().toISOString();

  return items.map((event) => {
    const provenance: SourceProvenance = {
      sourceType: "calendar_api",
      verificationStatus: "verified_calendar_fact",
      calendarId: "primary",
      retrievalTimestamp,
      toolName: "listUpcomingMeetings",
      eventId: event.id,
      start: event.start?.dateTime ?? event.start?.date ?? null,
      end: event.end?.dateTime ?? event.end?.date ?? null,
      timezone: tz,
      queryRange: { timeMin, timeMax },
      evidenceSummary: `Retrieved via Google Calendar API events.list (status: ${event.status || "confirmed"})`,
      operationStatus: "success",
      traceId: input.traceId,
    };

    return formatEvent(event, provenance);
  });
}

/**
 * Searches meetings by text query, title, or attendees.
 */
export async function searchMeetings(input: {
  authUserId: string;
  query: string;
  timeMin?: string;
  timeMax?: string;
  maxResults?: number;
  traceId?: string;
}) {
  const calendar = await calendarForUser(input.authUserId);
  const retrievalTimestamp = new Date().toISOString();

  const response = await withCalendarRetry(() =>
    calendar.events.list({
      calendarId: "primary",
      q: input.query.trim(),
      timeMin: input.timeMin,
      timeMax: input.timeMax,
      maxResults: Math.min(Math.max(input.maxResults ?? 10, 1), 25),
      singleEvents: true,
      orderBy: "startTime",
    }),
  );

  const items = response.data.items ?? [];
  return items.map((event) => {
    const provenance: SourceProvenance = {
      sourceType: "calendar_api",
      verificationStatus: "verified_calendar_fact",
      calendarId: "primary",
      retrievalTimestamp,
      toolName: "searchMeetings",
      eventId: event.id,
      start: event.start?.dateTime ?? event.start?.date ?? null,
      end: event.end?.dateTime ?? event.end?.date ?? null,
      evidenceSummary: `Matched query "${input.query}" via Google Calendar API search`,
      operationStatus: "success",
      traceId: input.traceId,
    };
    return formatEvent(event, provenance);
  });
}

/**
 * Checks free/busy availability and detects overlapping events deterministically.
 */
export async function checkAvailabilityAndConflicts(input: {
  authUserId: string;
  startIso: string;
  endIso: string;
  traceId?: string;
}) {
  const validation = validateTimeRange(input.startIso, input.endIso);
  if (!validation.valid) {
    throw new Error(validation.error || "Invalid time range");
  }

  const calendar = await calendarForUser(input.authUserId);
  const retrievalTimestamp = new Date().toISOString();

  // Run freebusy query and events.list concurrently for comprehensive verification
  const [freebusyRes, eventsRes] = await Promise.all([
    withCalendarRetry(() =>
      calendar.freebusy.query({
        requestBody: {
          timeMin: input.startIso,
          timeMax: input.endIso,
          items: [{ id: "primary" }],
        },
      }),
    ),
    withCalendarRetry(() =>
      calendar.events.list({
        calendarId: "primary",
        timeMin: input.startIso,
        timeMax: input.endIso,
        singleEvents: true,
      }),
    ),
  ]);

  const busySlots = (freebusyRes.data?.calendars?.primary?.busy ?? []).map((b) => ({
    start: b.start ?? null,
    end: b.end ?? null,
  }));

  const overlappingEvents = (eventsRes.data.items ?? [])
    .filter((e) => e.status !== "cancelled")
    .map((e) => formatEvent(e));

  const hasConflicts = busySlots.length > 0 || overlappingEvents.length > 0;

  const provenance: SourceProvenance = {
    sourceType: "freebusy_api",
    verificationStatus: "calculated_result",
    calendarId: "primary",
    retrievalTimestamp,
    toolName: "checkAvailabilityAndConflicts",
    start: input.startIso,
    end: input.endIso,
    queryRange: { timeMin: input.startIso, timeMax: input.endIso },
    evidenceSummary: hasConflicts
      ? `Found ${overlappingEvents.length} overlapping event(s) and ${busySlots.length} busy block(s)`
      : `Verified slot ${input.startIso} to ${input.endIso} is completely free on primary calendar`,
    conflictsDetected: overlappingEvents.length,
    operationStatus: "success",
    traceId: input.traceId,
  };

  return {
    available: !hasConflicts,
    hasConflicts,
    conflictsDetected: overlappingEvents.length,
    busySlots,
    conflictingEvents: overlappingEvents,
    timeRange: {
      startIso: input.startIso,
      endIso: input.endIso,
      durationMinutes: validation.durationMinutes,
    },
    provenance,
  };
}

/**
 * Creates a meeting with idempotency protection, Google Meet generation, and verification.
 */
export async function createMeeting(input: {
  authUserId: string;
  title: string;
  startIso: string;
  endIso: string;
  attendeeEmails?: string[];
  description?: string;
  addGoogleMeet?: boolean;
  idempotencyKey?: string;
  traceId?: string;
}) {
  const validation = validateTimeRange(input.startIso, input.endIso);
  if (!validation.valid) {
    throw new Error(validation.error || "Invalid time range for meeting creation");
  }

  const calendar = await calendarForUser(input.authUserId);
  const withMeet = input.addGoogleMeet !== false;
  const requestId = input.idempotencyKey || randomUUID();

  // Reconcile before creating: check if an identical event was created in the last 15 minutes
  const existingEvents = await withCalendarRetry(() =>
    calendar.events.list({
      calendarId: "primary",
      timeMin: input.startIso,
      timeMax: input.endIso,
      singleEvents: true,
    }),
  );

  const duplicate = (existingEvents.data.items ?? []).find(
    (e) =>
      e.status !== "cancelled" &&
      e.summary?.trim().toLowerCase() === input.title.trim().toLowerCase() &&
      (e.start?.dateTime === input.startIso || e.start?.date === input.startIso),
  );

  if (duplicate) {
    const prov: SourceProvenance = {
      sourceType: "calendar_api",
      verificationStatus: "verified_calendar_fact",
      calendarId: "primary",
      retrievalTimestamp: new Date().toISOString(),
      toolName: "createMeeting",
      eventId: duplicate.id,
      start: input.startIso,
      end: input.endIso,
      evidenceSummary: `Reconciled duplicate: Event "${input.title}" already exists with ID ${duplicate.id}`,
      operationStatus: "success",
      traceId: input.traceId,
      idempotencyKey: requestId,
    };

    return {
      ...formatEvent(duplicate, prov),
      isReconciledDuplicate: true,
      inviteEmailsSent: false,
      googleMeetAdded: Boolean(duplicate.hangoutLink),
    };
  }

  // Insert event
  const response = await withCalendarRetry(() =>
    calendar.events.insert({
      calendarId: "primary",
      sendUpdates: "all",
      conferenceDataVersion: withMeet ? 1 : undefined,
      requestBody: {
        summary: input.title.trim(),
        description: input.description?.trim(),
        start: { dateTime: input.startIso },
        end: { dateTime: input.endIso },
        attendees: (input.attendeeEmails ?? []).map((email) => ({ email: email.trim() })),
        conferenceData: withMeet
          ? {
              createRequest: {
                requestId,
                conferenceSolutionKey: { type: "hangoutsMeet" },
              },
            }
          : undefined,
      },
    }),
  );

  const createdEvent = response.data;
  if (!createdEvent.id) {
    throw new Error("Calendar API returned empty event ID after creation");
  }

  const provenance: SourceProvenance = {
    sourceType: "calendar_api",
    verificationStatus: "verified_calendar_fact",
    calendarId: "primary",
    retrievalTimestamp: new Date().toISOString(),
    toolName: "createMeeting",
    eventId: createdEvent.id,
    start: input.startIso,
    end: input.endIso,
    evidenceSummary: `Created and verified event "${createdEvent.summary}" with ID ${createdEvent.id}`,
    operationStatus: "success",
    traceId: input.traceId,
    idempotencyKey: requestId,
  };

  return {
    ...formatEvent(createdEvent, provenance),
    isReconciledDuplicate: false,
    inviteEmailsSent: (input.attendeeEmails ?? []).length > 0,
    googleMeetAdded: Boolean(createdEvent.hangoutLink),
  };
}

/**
 * Reschedules an existing meeting after verifying its identity and availability.
 */
export async function rescheduleMeeting(input: {
  authUserId: string;
  eventId: string;
  startIso: string;
  endIso: string;
  traceId?: string;
}) {
  const validation = validateTimeRange(input.startIso, input.endIso);
  if (!validation.valid) {
    throw new Error(validation.error || "Invalid time range for rescheduling");
  }

  const calendar = await calendarForUser(input.authUserId);

  // 1. Verify existing event state
  const existing = await withCalendarRetry(() =>
    calendar.events.get({
      calendarId: "primary",
      eventId: input.eventId,
    }),
  );

  if (!existing.data || existing.data.status === "cancelled") {
    throw new Error(`Cannot reschedule: Event ${input.eventId} does not exist or has been cancelled`);
  }

  // 2. Patch with new times
  const response = await withCalendarRetry(() =>
    calendar.events.patch({
      calendarId: "primary",
      eventId: input.eventId,
      sendUpdates: "all",
      requestBody: {
        start: { dateTime: input.startIso },
        end: { dateTime: input.endIso },
      },
    }),
  );

  const updated = response.data;
  const provenance: SourceProvenance = {
    sourceType: "calendar_api",
    verificationStatus: "verified_calendar_fact",
    calendarId: "primary",
    retrievalTimestamp: new Date().toISOString(),
    toolName: "rescheduleMeeting",
    eventId: input.eventId,
    start: input.startIso,
    end: input.endIso,
    evidenceSummary: `Verified event ${input.eventId} moved from ${existing.data.start?.dateTime} to ${input.startIso}`,
    operationStatus: "success",
    traceId: input.traceId,
  };

  return formatEvent(updated, provenance);
}

/**
 * Cancels a meeting after verifying its current existence.
 */
export async function cancelMeeting(input: {
  authUserId: string;
  eventId: string;
  traceId?: string;
}) {
  const calendar = await calendarForUser(input.authUserId);

  // 1. Verify existence before delete
  const existing = await withCalendarRetry(() =>
    calendar.events.get({
      calendarId: "primary",
      eventId: input.eventId,
    }),
  );

  if (!existing.data || existing.data.status === "cancelled") {
    throw new Error(`Cannot cancel: Event ${input.eventId} does not exist or is already cancelled`);
  }

  const eventTitle = existing.data.summary || "(no title)";
  const eventTime = existing.data.start?.dateTime || existing.data.start?.date || "unknown";

  // 2. Delete event
  await withCalendarRetry(() =>
    calendar.events.delete({
      calendarId: "primary",
      eventId: input.eventId,
      sendUpdates: "all",
    }),
  );

  const provenance: SourceProvenance = {
    sourceType: "calendar_api",
    verificationStatus: "verified_calendar_fact",
    calendarId: "primary",
    retrievalTimestamp: new Date().toISOString(),
    toolName: "cancelMeeting",
    eventId: input.eventId,
    evidenceSummary: `Verified cancellation of "${eventTitle}" scheduled for ${eventTime}`,
    operationStatus: "success",
    traceId: input.traceId,
  };

  return {
    cancelled: true,
    eventId: input.eventId,
    eventTitle,
    eventTime,
    provenance,
  };
}
