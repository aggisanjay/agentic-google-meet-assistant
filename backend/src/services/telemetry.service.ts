import { randomUUID } from "node:crypto";
import { performance } from "node:perf_hooks";

export const PRICING_VERSION = "2026-10-v1";

export type ModelPricing = {
  inputPerMillion: number;
  outputPerMillion: number;
  currency: string;
};

export const MODEL_PRICING: Record<string, ModelPricing> = {
  "google/gemini-3.5-flash": { inputPerMillion: 0.075, outputPerMillion: 0.3, currency: "USD" },
  "google/gemini-3.6-flash": { inputPerMillion: 0.075, outputPerMillion: 0.3, currency: "USD" },
  "openai/gpt-4o-mini": { inputPerMillion: 0.15, outputPerMillion: 0.6, currency: "USD" },
  "openai/gpt-4o": { inputPerMillion: 2.5, outputPerMillion: 10.0, currency: "USD" },
  "huggingface/Qwen/Qwen3.8-27B": { inputPerMillion: 0.0, outputPerMillion: 0.0, currency: "USD" },
};

export type RequestTelemetry = {
  requestId: string;
  authUserId: string;
  threadId: string;
  model: string;
  provider: string;
  startTime: number;
  firstTokenTime?: number;
  endTime?: number;
  totalDurationMs?: number;
  timeToFirstTokenMs?: number;
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
  modelCallsCount: number;
  toolCallsCount: number;
  estimatedCostUsd?: number;
  costStatus: "exact" | "estimated" | "unknown";
  pricingVersion: string;
  status: "success" | "failed" | "cancelled";
  errorCategory?: string;
};

export function calculateEstimatedCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
): { costUsd?: number; status: "exact" | "estimated" | "unknown" } {
  const normalizedModel = Object.keys(MODEL_PRICING).find(
    (key) => model.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(model.toLowerCase()),
  );

  if (!normalizedModel) {
    return { status: "unknown" };
  }

  const pricing = MODEL_PRICING[normalizedModel];
  const inputCost = (inputTokens / 1_000_000) * pricing.inputPerMillion;
  const outputCost = (outputTokens / 1_000_000) * pricing.outputPerMillion;
  const total = Number((inputCost + outputCost).toFixed(6));

  return { costUsd: total, status: "estimated" };
}

export class TelemetryTracker {
  private telemetry: RequestTelemetry;

  constructor(authUserId: string, threadId: string, model: string, requestId = randomUUID()) {
    const provider = model.includes("/") ? model.split("/")[0] : "google";
    this.telemetry = {
      requestId,
      authUserId,
      threadId,
      model,
      provider,
      startTime: performance.now(),
      inputTokens: 0,
      outputTokens: 0,
      cachedTokens: 0,
      modelCallsCount: 1,
      toolCallsCount: 0,
      costStatus: "unknown",
      pricingVersion: PRICING_VERSION,
      status: "success",
    };
  }

  recordFirstToken(): void {
    if (!this.telemetry.firstTokenTime) {
      this.telemetry.firstTokenTime = performance.now();
      this.telemetry.timeToFirstTokenMs = Math.round(
        this.telemetry.firstTokenTime - this.telemetry.startTime,
      );
    }
  }

  incrementToolCall(): void {
    this.telemetry.toolCallsCount++;
  }

  recordTokens(inputTokens: number, outputTokens: number, cachedTokens = 0): void {
    this.telemetry.inputTokens += inputTokens;
    this.telemetry.outputTokens += outputTokens;
    this.telemetry.cachedTokens += cachedTokens;

    const { costUsd, status } = calculateEstimatedCost(
      this.telemetry.model,
      this.telemetry.inputTokens,
      this.telemetry.outputTokens,
    );
    this.telemetry.estimatedCostUsd = costUsd;
    this.telemetry.costStatus = status;
  }

  recordFailure(error: unknown, category = "model_error"): void {
    this.telemetry.status = "failed";
    this.telemetry.errorCategory = category;
  }

  finalize(): RequestTelemetry {
    this.telemetry.endTime = performance.now();
    this.telemetry.totalDurationMs = Math.round(
      this.telemetry.endTime - this.telemetry.startTime,
    );

    // If no tokens were recorded via API metadata, compute estimate from output tokens count
    if (this.telemetry.outputTokens > 0 && this.telemetry.costStatus === "unknown") {
      const { costUsd, status } = calculateEstimatedCost(
        this.telemetry.model,
        this.telemetry.inputTokens,
        this.telemetry.outputTokens,
      );
      this.telemetry.estimatedCostUsd = costUsd;
      this.telemetry.costStatus = status;
    }

    // Structured operational logging (omitting tokens/PII)
    console.log(
      JSON.stringify({
        level: "info",
        type: "request_telemetry",
        requestId: this.telemetry.requestId,
        authUserId: this.telemetry.authUserId,
        threadId: this.telemetry.threadId,
        model: this.telemetry.model,
        totalDurationMs: this.telemetry.totalDurationMs,
        timeToFirstTokenMs: this.telemetry.timeToFirstTokenMs ?? null,
        toolCallsCount: this.telemetry.toolCallsCount,
        inputTokens: this.telemetry.inputTokens,
        outputTokens: this.telemetry.outputTokens,
        estimatedCostUsd: this.telemetry.estimatedCostUsd ?? null,
        costStatus: this.telemetry.costStatus,
        status: this.telemetry.status,
      }),
    );

    return { ...this.telemetry };
  }

  getRequestId(): string {
    return this.telemetry.requestId;
  }
}

// In-memory ring buffer for recent telemetry stats (p50, p95)
const MAX_SAMPLES = 500;
const latencySamples: number[] = [];

export function recordLatencySample(ms: number) {
  if (latencySamples.length >= MAX_SAMPLES) {
    latencySamples.shift();
  }
  latencySamples.push(ms);
}

export function getLatencySummary(): {
  sampleSize: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
} {
  if (latencySamples.length === 0) {
    return { sampleSize: 0, p50Ms: 0, p95Ms: 0, p99Ms: 0 };
  }
  const sorted = [...latencySamples].sort((a, b) => a - b);
  const p50 = sorted[Math.floor(sorted.length * 0.5)];
  const p95 = sorted[Math.floor(sorted.length * 0.95)];
  const p99 = sorted[Math.floor(sorted.length * 0.99)];
  return {
    sampleSize: sorted.length,
    p50Ms: Math.round(p50),
    p95Ms: Math.round(p95),
    p99Ms: Math.round(p99),
  };
}
