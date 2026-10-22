import { Router } from "express";
import { getAuthUser, requireSession } from "../middleware/requireSession.js";
import {
  createCalendarConnectUrl,
  getCalendarConnection,
  refreshCalendarConnection,
} from "../services/connection.service.js";

export const connectionRouter = Router();

connectionRouter.use(requireSession);

connectionRouter.get("/", async (req, res) => {
  try {
    const auth = getAuthUser(req);
    const connection = await getCalendarConnection(auth.userId);

    res.json({ connection });
  } catch (err) {
    console.error("GET /api/connections error:", err);
    res.status(500).json({ error: "could not load connections" });
  }
});

connectionRouter.post("/connect", async (req, res) => {
  try {
    const auth = getAuthUser(req);
    const refreshToken =
      typeof req.body?.refreshToken === "string" ? req.body.refreshToken : "";

    if (!refreshToken) {
      res.status(400).json({ error: "Refresh token required" });
      return;
    }

    const redirectUrl =
      typeof req.body?.redirectUrl === "string"
        ? req.body.redirectUrl
        : `${process.env.APP_URL ?? "http://localhost:3000"}/dashboard`;

    const result = await createCalendarConnectUrl({
      userId: auth.userId,
      refreshToken,
      redirectUrl,
    });

    res.json(result);
  } catch (err) {
    console.error("POST /api/connections/connect error:", err);
    const message =
      err instanceof Error ? err.message : "could not start connection";
    res.status(500).json({ error: message });
  }
});

connectionRouter.post("/refresh-status", async (req, res) => {
  try {
    const auth = getAuthUser(req);
    const connection = await refreshCalendarConnection({
      userId: auth.userId,
      authUserId: auth.authUserId,
    });

    res.json({ connection });
  } catch (err) {
    console.error("POST /api/connections/refresh-status error:", err);
    res.status(500).json({ error: "failed to refresh the status" });
  }
});
