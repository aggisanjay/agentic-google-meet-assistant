import { describe, it, expect, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { requireSession, getAuthUser } from "../src/middleware/requireSession.js";

// Mock descope and db user repository
vi.mock("../src/config/descope.js", () => ({
  descopeClient: {
    validateSession: vi.fn(),
  },
  CALENDAR_CONNECTION_ID: "google-calendar",
  CALENDAR_CONNECTION_LABEL: "Google Calendar",
}));

vi.mock("../src/repositories/user.repository.js", () => ({
  ensureUser: vi.fn().mockResolvedValue({
    id: "uuid-1234",
    auth_user_id: "descope-user-1",
    email: "test@example.com",
    created_at: new Date(),
  }),
}));

import { descopeClient } from "../src/config/descope.js";

describe("requireSession middleware", () => {
  it("rejects requests missing the Authorization header", async () => {
    const req = { headers: {} } as Request;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;
    const next = vi.fn() as NextFunction;

    await requireSession(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "Unauthorized", success: false }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("authenticates valid token and attaches userAuth to request", async () => {
    const mockToken = "valid-session-jwt";
    (descopeClient.validateSession as any).mockResolvedValueOnce({
      token: {
        sub: "descope-user-1",
        email: "test@example.com",
        name: "Test User",
      },
    });

    const req = {
      headers: { authorization: `Bearer ${mockToken}` },
    } as unknown as Request;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;
    const next = vi.fn() as NextFunction;

    await requireSession(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.userAuth).toBeDefined();
    expect(req.userAuth?.authUserId).toBe("descope-user-1");
    expect(req.userAuth?.userId).toBe("uuid-1234");
    expect(req.userAuth?.email).toBe("test@example.com");

    const auth = getAuthUser(req);
    expect(auth.authUserId).toBe("descope-user-1");
  });

  it("rejects token with missing sub claim", async () => {
    (descopeClient.validateSession as any).mockResolvedValueOnce({
      token: {
        email: "test@example.com",
      },
    });

    const req = {
      headers: { authorization: "Bearer invalid-sub" },
    } as unknown as Request;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;
    const next = vi.fn() as NextFunction;

    await requireSession(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
