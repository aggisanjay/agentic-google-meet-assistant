import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import {
  cancelMeeting,
  checkAvailabilityAndConflicts,
  createMeeting,
  listUpcomingMeetings,
  rescheduleMeeting,
  searchMeetings,
} from "./calendar.service.js";

const isoDateTimeSchema = z
  .string()
  .describe("ISO-8601 formatted datetime string (e.g. 2026-10-23T10:00:00Z)");

export function createCalendarTools(authUserId: string, defaultTimezone = "UTC") {
  return {
    listUpcomingMeetings: createTool({
      id: "listUpcomingMeetings",
      description:
        "List Google Calendar events for a defined time window. Use todayOnly=true for today's agenda in user's timezone.",
      inputSchema: z.object({
        maxResults: z.number().int().min(1).max(50).optional(),
        todayOnly: z
          .boolean()
          .optional()
          .describe("If true, calculates day boundaries strictly in user's timezone"),
        timezone: z
          .string()
          .optional()
          .describe("IANA timezone identifier, e.g. America/New_York, Asia/Kolkata"),
        timeMin: isoDateTimeSchema.optional(),
        timeMax: isoDateTimeSchema.optional(),
      }),
      execute: async ({ maxResults, todayOnly, timezone, timeMin, timeMax }) => {
        try {
          const meetings = await listUpcomingMeetings({
            authUserId,
            maxResults,
            todayOnly,
            timezone: timezone || defaultTimezone,
            timeMin,
            timeMax,
          });
          return { success: true, count: meetings.length, meetings };
        } catch (error: any) {
          return {
            success: false,
            error: error?.message || "Failed to list meetings from Google Calendar",
          };
        }
      },
    }),

    searchMeetings: createTool({
      id: "searchMeetings",
      description: "Search Google Calendar events by title, description, or attendee keywords.",
      inputSchema: z.object({
        query: z.string().min(1).describe("Search text or attendee name/email to match"),
        timeMin: isoDateTimeSchema.optional(),
        timeMax: isoDateTimeSchema.optional(),
        maxResults: z.number().int().min(1).max(25).optional(),
      }),
      execute: async ({ query, timeMin, timeMax, maxResults }) => {
        try {
          const results = await searchMeetings({
            authUserId,
            query,
            timeMin,
            timeMax,
            maxResults,
          });
          return { success: true, count: results.length, meetings: results };
        } catch (error: any) {
          return {
            success: false,
            error: error?.message || "Failed to search meetings",
          };
        }
      },
    }),

    checkCalendarBusy: createTool({
      id: "checkCalendarBusy",
      description:
        "Check availability and detect overlapping meetings between start and end ISO datetimes.",
      inputSchema: z.object({
        startIso: isoDateTimeSchema,
        endIso: isoDateTimeSchema,
      }),
      execute: async ({ startIso, endIso }) => {
        try {
          const result = await checkAvailabilityAndConflicts({
            authUserId,
            startIso,
            endIso,
          });
          return { success: true, ...result };
        } catch (error: any) {
          return {
            success: false,
            error: error?.message || "Failed to check calendar availability",
          };
        }
      },
    }),

    createMeeting: createTool({
      id: "createMeeting",
      description:
        "Create a Google Calendar event. Adds a Google Meet link by default. Automatically checks for duplicate events.",
      inputSchema: z.object({
        title: z.string().min(1).describe("Meeting subject/summary"),
        startIso: isoDateTimeSchema,
        endIso: isoDateTimeSchema,
        attendeeEmails: z
          .array(z.string().email("Invalid attendee email address"))
          .optional()
          .describe("Valid email addresses of invitees to send Google Calendar invitations to"),
        description: z.string().optional().describe("Meeting description or agenda notes"),
        addGoogleMeet: z
          .boolean()
          .optional()
          .describe("Default true. Set false to skip Google Meet video conferencing"),
        idempotencyKey: z
          .string()
          .optional()
          .describe("Optional unique idempotency token to prevent duplicate creation on retry"),
      }),
      execute: async (input) => {
        try {
          const result = await createMeeting({
            authUserId,
            ...input,
          });
          return { success: true, meeting: result };
        } catch (error: any) {
          return {
            success: false,
            error: error?.message || "Failed to create meeting on Google Calendar",
          };
        }
      },
    }),

    rescheduleMeeting: createTool({
      id: "rescheduleMeeting",
      description:
        "Move an existing event to a new start and end time. Verifies the event exists before updating.",
      inputSchema: z.object({
        eventId: z.string().min(1).describe("Google Calendar event ID to reschedule"),
        startIso: isoDateTimeSchema,
        endIso: isoDateTimeSchema,
      }),
      execute: async (input) => {
        try {
          const result = await rescheduleMeeting({
            authUserId,
            ...input,
          });
          return { success: true, meeting: result };
        } catch (error: any) {
          return {
            success: false,
            error: error?.message || "Failed to reschedule meeting",
          };
        }
      },
    }),

    cancelMeeting: createTool({
      id: "cancelMeeting",
      description:
        "Cancel a Google Calendar event by ID. Verifies event existence before deletion and sends updates to invitees.",
      inputSchema: z.object({
        eventId: z.string().min(1).describe("Google Calendar event ID to cancel"),
      }),
      execute: async (input) => {
        try {
          const result = await cancelMeeting({
            authUserId,
            ...input,
          });
          return { success: true, ...result };
        } catch (error: any) {
          return {
            success: false,
            error: error?.message || "Failed to cancel meeting",
          };
        }
      },
    }),
  };
}
