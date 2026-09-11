import { Agent } from "@mastra/core/agent";
import { createAgentMemory } from "../config/memory.js";
import { getAgentInstructions } from "../config/agent-instructions.js";
import { createCalendarTools } from "./agent-tools.service.js";

// Intercept requests to Hugging Face router to ensure OpenAI / Cerebras API compatibility:
// 1. Move any middle system messages (like Mastra working memory) to the top prompt
// 2. Strip unsupported reasoning_content from prior assistant messages
if (typeof globalThis.fetch === "function" && !(globalThis as any).__hfFetchPatched) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async function (input, init) {
    if (
      typeof input === "string" &&
      input.includes("router.huggingface.co") &&
      init?.body
    ) {
      try {
        const parsed = JSON.parse(init.body.toString());
        if (Array.isArray(parsed.messages)) {
          const systemParts: string[] = [];
          const nonSystemMessages: any[] = [];
          for (const msg of parsed.messages) {
            if (msg.role === "system") {
              systemParts.push(
                typeof msg.content === "string"
                  ? msg.content
                  : JSON.stringify(msg.content),
              );
            } else {
              if (msg && typeof msg === "object" && "reasoning_content" in msg) {
                delete msg.reasoning_content;
              }
              nonSystemMessages.push(msg);
            }
          }
          parsed.messages = [
            ...(systemParts.length > 0
              ? [{ role: "system", content: systemParts.join("\n\n") }]
              : []),
            ...nonSystemMessages,
          ];
          init.body = JSON.stringify(parsed);
        }
      } catch {}
    }
    return originalFetch.call(this, input, init);
  };
  (globalThis as any).__hfFetchPatched = true;
}

export type AgentEvent = {
  type: "started" | "progress" | "token" | "completed" | "error";
  message?: string;
  token?: string;
};

export type StreamAgentReplyInput = {
  userId: string;
  authUserId: string;
  threadId: string;
  message: string;
  onEvent: (event: AgentEvent) => void;
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
};

function normalizeApiKeys() {
  if (!process.env.GOOGLE_API_KEY && process.env.GOOGLE_GEMINI_API_KEY) {
    process.env.GOOGLE_API_KEY = process.env.GOOGLE_GEMINI_API_KEY;
  }
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY && process.env.GOOGLE_GEMINI_API_KEY) {
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY;
  }
  if (!process.env.HF_TOKEN) {
    const hfKey = process.env.HUGGINGFACE_API_KEY || process.env.HF_API_KEY;
    if (hfKey) {
      process.env.HF_TOKEN = hfKey;
    }
  }
}

function modelName() {
  if (process.env.AI_MODEL) {
    return process.env.AI_MODEL.includes("/")
      ? process.env.AI_MODEL
      : `google/${process.env.AI_MODEL}`;
  }
  if (
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GEMINI_API_KEY
  ) {
    return "google/gemini-3.5-flash";
  }
  if (process.env.HF_TOKEN || process.env.HUGGINGFACE_API_KEY || process.env.HF_API_KEY) {
    return getHfModelName();
  }
  return `openai/${process.env.AI_MODEL ?? "gpt-4o-mini"}`;
}

export function getHfModelName() {
  if (process.env.HF_MODEL) {
    return process.env.HF_MODEL.includes("/")
      ? process.env.HF_MODEL
      : `huggingface/${process.env.HF_MODEL}`;
  }
  return "huggingface/Qwen/Qwen3.8-27B";
}

export function isRateLimitOrQuotaError(error: unknown): boolean {
  if (!error) return false;
  const msg = (error instanceof Error ? error.message : String(error)).toLowerCase();
  return (
    msg.includes("429") ||
    msg.includes("quota") ||
    msg.includes("rate limit") ||
    msg.includes("rate_limit") ||
    msg.includes("resource_exhausted") ||
    msg.includes("overloaded") ||
    msg.includes("too many requests") ||
    msg.includes("capacity")
  );
}

function messageText(content: unknown): string {
  if (typeof content === "string") return content.trim();
  if (!content || typeof content !== "object") return "";

  const record = content as {
    content?: unknown;
    parts?: Array<{ type?: string; text?: string }>;
  };

  if (typeof record.content === "string" && record.content.trim()) {
    return record.content.trim();
  }

  if (!Array.isArray(record.parts)) return "";
  return record.parts
    .filter((part) => part.type === "text" && typeof part.text === "string")
    .map((part) => part.text!.trim())
    .filter(Boolean)
    .join("\n")
    .trim();
}

export async function listUserThreads(
  authUserId: string,
): Promise<ThreadSummary[]> {
  const memory = createAgentMemory();

  const result = await memory.listThreads({
    filter: { resourceId: authUserId },
    perPage: 30,
    orderBy: { field: "updatedAt", direction: "DESC" },
  });

  return result.threads.map((thread) => ({
    id: thread.id,
    title: thread.title?.trim() || "Untitled Chat",
    updatedAt:
      thread.updatedAt instanceof Date
        ? thread.updatedAt.toISOString()
        : String(thread.updatedAt),
  }));
}

export async function getThreadMessages(
  authUserId: string,
  threadId: string,
): Promise<ThreadMessage[]> {
  const memory = createAgentMemory();

  const thread = await memory.getThreadById({
    threadId,
    resourceId: authUserId,
  });

  if (!thread || thread.resourceId !== authUserId) {
    throw new Error("Thread not found");
  }

  const recalledMemoryData = await memory.recall({
    threadId,
    resourceId: authUserId,
    perPage: false,
  });

  const messages: ThreadMessage[] = [];

  for (const message of recalledMemoryData.messages) {
    const content = messageText(message.content);

    if (!content) {
      continue;
    }

    const role: ThreadMessage["role"] =
      message.role === "user" || message.role === "assistant"
        ? message.role
        : "system";

    messages.push({
      id: message.id,
      role,
      content,
    });
  }

  return messages;
}

export async function deleteUserThread(
  authUserId: string,
  threadId: string,
): Promise<void> {
  const memory = createAgentMemory();

  const thread = await memory.getThreadById({
    threadId,
    resourceId: authUserId,
  });

  if (!thread || thread.resourceId !== authUserId) {
    throw new Error("Thread not found");
  }

  await memory.deleteThread(threadId);
}

async function runModelStream(
  model: string,
  input: StreamAgentReplyInput,
  memory: ReturnType<typeof createAgentMemory>,
): Promise<{ tokenCount: number }> {
  const agent = new Agent({
    id: "meeting-assistant",
    name: "Meeting Assistant",
    instructions: getAgentInstructions(),
    model,
    tools: createCalendarTools(input.authUserId),
    memory,
  });

  const result = await agent.stream(input.message, {
    memory: {
      resource: input.authUserId,
      thread: input.threadId,
    },
  });

  let tokenCount = 0;

  for await (const chunk of result.fullStream) {
    // Detect error chunks emitted by Mastra's stream
    if (chunk.type === "error") {
      const payloadError = (chunk as any).payload?.error || (chunk as any).error;
      const errorMsg =
        payloadError instanceof Error
          ? payloadError.message
          : typeof payloadError === "string"
            ? payloadError
            : JSON.stringify(payloadError || {});
      throw new Error(errorMsg || "Stream error occurred");
    }

    if (chunk.type === "tool-call") {
      input.onEvent({
        type: "progress",
        message: `Running ${chunk.payload.toolName}`,
      });
      continue;
    }

    if (chunk.type === "text-delta") {
      const text = chunk.payload.text;
      if (text) {
        tokenCount++;
        input.onEvent({
          type: "token",
          token: text,
        });
      }
    }
  }

  if (tokenCount === 0) {
    throw new Error("Model failed to generate response tokens");
  }

  return { tokenCount };
}

export async function streamAgentReply(input: StreamAgentReplyInput) {
  normalizeApiKeys();

  const hasGeminiKey = Boolean(
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.GOOGLE_GEMINI_API_KEY,
  );
  const hasHfToken = Boolean(
    process.env.HF_TOKEN ||
    process.env.HUGGINGFACE_API_KEY ||
    process.env.HF_API_KEY,
  );
  const hasOpenAiKey = Boolean(process.env.OPENAI_API_KEY);

  if (!hasGeminiKey && !hasHfToken && !hasOpenAiKey) {
    throw new Error(
      "No AI provider key found. Please set GOOGLE_GEMINI_API_KEY or HF_TOKEN in your environment.",
    );
  }

  input.onEvent({
    type: "started",
    message: "Agent is planning",
  });

  const memory = createAgentMemory();
  const primaryModel = modelName();
  const hfModel = getHfModelName();

  let finished = false;

  try {
    await runModelStream(primaryModel, input, memory);
    finished = true;
  } catch (error: any) {
    const isLimit = isRateLimitOrQuotaError(error);
    console.warn(`Primary model (${primaryModel}) failed:`, error?.message || error);

    if (hasHfToken && primaryModel !== hfModel) {
      input.onEvent({
        type: "progress",
        message: isLimit
          ? "Gemini quota/rate limit reached. Switching to Hugging Face fallback..."
          : "Gemini unavailable. Switching to Hugging Face fallback...",
      });

      try {
        await runModelStream(hfModel, input, memory);
        finished = true;
      } catch (hfError: any) {
        console.error(`Hugging Face fallback (${hfModel}) failed:`, hfError?.message || hfError);
        throw new Error(
          `Both Gemini and Hugging Face failed. Primary: ${error?.message || error}. Fallback: ${hfError?.message || hfError}`,
        );
      }
    } else {
      if (isLimit) {
        throw new Error(
          "Gemini rate limit or quota exceeded. Please configure HF_TOKEN in your environment variables to automatically enable Hugging Face fallback.",
        );
      }
      throw error;
    }
  }

  if (finished) {
    const thread = await memory.getThreadById({
      threadId: input.threadId,
      resourceId: input.authUserId,
    });

    if (thread && !thread.title?.trim()) {
      await memory.updateThread({
        id: thread.id,
        title: input.message.slice(0, 80),
        metadata: thread.metadata ?? {},
      });
    }

    input.onEvent({
      type: "completed",
      message: "done",
    });
  }
}
