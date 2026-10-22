import { AuthenticatedExtra, defineTool } from "@descope/mcp-express";
import { z } from "zod";
import { listUpcomingMeetings } from "../services/calendar.service.js";

function textResult(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

import { descopeClient } from "../config/descope.js";

async function authUserIdFromToken(token: string): Promise<string> {
  const authInfo = await descopeClient.validateSession(token);
  if (!authInfo || !authInfo.token) {
    throw new Error("Invalid or unverified MCP token");
  }

  const claims = authInfo.token as Record<string, unknown>;
  const sub = String(claims.sub ?? "").trim();

  if (!sub) {
    throw new Error("MCP token has no valid subject claim");
  }

  return sub;
}

const defineMcpTool = defineTool as (cfg: {
  name: string;
  description: string;
  input?: Record<string, unknown>;
  scopes?: string[];
  handler: (
    args: Record<string, unknown>,
    extra: AuthenticatedExtra,
  ) => ReturnType<typeof textResult> | Promise<ReturnType<typeof textResult>>;
}) => ReturnType<typeof defineTool>;

export const listUpcomingMeetingsTools = defineMcpTool({
  name: "listUpcomingMeetings",
  description:
    "List Google Calendar events. Set todayOnly=true for today's agenda only.",
  input: {
    maxResults: z.number().int().min(1).max(20).optional(),

    todayOnly: z
      .boolean()
      .optional()
      .describe("If true, only return events for today"),
  },
  scopes: ["profile"],
  handler: async (args, extra) => {
    try {
      const authUserId = await authUserIdFromToken(extra.authInfo.token);

      const meetings = await listUpcomingMeetings({
        authUserId,
        maxResults:
          typeof args.maxResults === "number" ? args.maxResults : undefined,
        todayOnly:
          typeof args.todayOnly === "boolean" ? args.todayOnly : undefined,
      });

      return textResult({ meetings });
    } catch (error) {
      const message = error instanceof Error ? error.message : "List Failed";
      return textResult({ error: message });
    }
  },
});
