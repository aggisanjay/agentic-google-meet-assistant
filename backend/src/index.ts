import "dotenv/config";
import cors from "cors";
import express, { Request, Response, NextFunction } from "express";
import { randomUUID } from "node:crypto";
import { getPool } from "./db/pool.js";
import { connectionRouter } from "./routes/connection.routes.js";
import { agentRoutes } from "./routes/agent.routes.js";
import { mountMcpServer } from "./mcp/mount.js";
import { getLatencySummary } from "./services/telemetry.service.js";

const app = express();
const port = Number(process.env.PORT) || 4000;
const appOrigin = process.env.APP_URL ?? "http://localhost:3000";

// Correlation / Request ID tracking
app.use((req: Request, res: Response, next: NextFunction) => {
  const incomingId = req.headers["x-request-id"];
  const requestId = typeof incomingId === "string" ? incomingId : randomUUID();
  res.setHeader("x-request-id", requestId);
  (req as any).requestId = requestId;
  next();
});

app.use(
  cors({
    origin: appOrigin,
    credentials: true,
  }),
);

// Body limit defense against large payload DoS
app.use(express.json({ limit: "512kb" }));

// Liveness Check
app.get("/health", async (_req, res) => {
  try {
    await getPool().query("SELECT 1");
    res.json({
      status: "ok",
      service: "agentic-calendar-assistant",
      database: "up",
      timestamp: new Date().toISOString(),
    });
  } catch {
    res.status(503).json({
      status: "error",
      service: "agentic-calendar-assistant",
      database: "down",
      timestamp: new Date().toISOString(),
    });
  }
});

// Readiness & Observability
app.get("/ready", async (_req, res) => {
  const latency = getLatencySummary();
  res.json({
    status: "ready",
    uptimeSeconds: Math.round(process.uptime()),
    performance: latency,
  });
});

app.use("/api/connections", connectionRouter);
app.use("/api/agent", agentRoutes);

mountMcpServer(app);

// Safe global error handler avoiding stack trace leaks
app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  const reqId = (req as any).requestId || "unknown";
  console.error(`[Error] Request ID ${reqId}:`, err?.message || err);

  if (res.headersSent) {
    return;
  }

  const statusCode = typeof err?.status === "number" ? err.status : 500;
  res.status(statusCode).json({
    error: err?.message || "Internal server error",
    requestId: reqId,
  });
});

app.listen(port, () => {
  console.log(`Agentic Calendar App is running on port: ${port}`);
});
