import { apiFetch } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export type SourceProvenance = {
  sourceType: string;
  verificationStatus: string;
  calendarId: string;
  retrievalTimestamp: string;
  toolName?: string;
  eventId?: string | null;
  start?: string | null;
  end?: string | null;
  timezone?: string;
  evidenceSummary?: string;
  conflictsDetected?: number;
  operationStatus: string;
  traceId?: string;
};

export type TelemetryData = {
  requestId: string;
  model: string;
  totalDurationMs?: number;
  timeToFirstTokenMs?: number;
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd?: number;
  status: string;
};

export type AgentStreamEvent = {
  type: "started" | "progress" | "token" | "provenance" | "telemetry" | "completed" | "error";
  message?: string;
  token?: string;
  provenance?: SourceProvenance;
  telemetry?: TelemetryData;
};

export type ThreadSummary = {
  id: string;
  title: string;
  updatedAt: string;
};

export type ThreadMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  provenance?: SourceProvenance[];
  telemetry?: TelemetryData;
};

export async function listThreads(token: string) {
  return apiFetch<{ threads: ThreadSummary[] }>("/api/agent/threads", {
    token,
  });
}

export async function loadThread(token: string, threadId: string) {
  return apiFetch<{ threadId: string; messages: ThreadMessage[] }>(
    `/api/agent/threads/${threadId}`,
    { token },
  );
}

export async function deleteThread(token: string, threadId: string) {
  return apiFetch<{ success: boolean; threadId: string }>(
    `/api/agent/threads/${threadId}`,
    {
      method: "DELETE",
      token,
    },
  );
}

export async function streamAgentChat(
  token: string,
  input: { message: string; threadId: string; timezone?: string },
  onEvent: (event: AgentStreamEvent) => void,
  signal?: AbortSignal,
) {
  const userTimezone =
    input.timezone ||
    (typeof Intl !== "undefined"
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : "UTC");

  const res = await fetch(`${API_URL}/api/agent/chat`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify({
      ...input,
      timezone: userTimezone,
    }),
    signal,
  });

  if (!res.ok || !res.body) {
    let errorMessage = "Agent request failed";
    try {
      const errJson = await res.json();
      if (errJson?.error) errorMessage = errJson.error;
    } catch {}
    throw new Error(errorMessage);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { value, done } = await reader.read();

      buffer += decoder.decode(value, { stream: !done });

      const blocks = buffer.split(/\n\n/);
      buffer = blocks.pop() ?? "";

      for (const block of blocks) {
        for (const line of block.split("\n")) {
          if (!line.startsWith("data:")) continue;
          const data = line.slice(5).trim();
          if (data) {
            try {
              onEvent(JSON.parse(data) as AgentStreamEvent);
            } catch (parseErr) {
              console.warn("Failed to parse SSE line:", data, parseErr);
            }
          }
        }
      }

      if (done) break;
    }
  } catch (err: any) {
    if (err?.name === "AbortError") {
      onEvent({ type: "progress", message: "Request cancelled by user" });
      return;
    }
    throw err;
  }
}
