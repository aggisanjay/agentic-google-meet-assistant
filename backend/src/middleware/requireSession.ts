import type { Request, Response, NextFunction } from "express";
import { descopeClient } from "../config/descope.js";
import { ensureUser } from "../repositories/user.repository.js";

export type AuthContext = {
  authUserId: string;
  email?: string;
  name?: string;
  userId: string;
  token: Record<string, unknown>;
};

declare module "express-serve-static-core" {
  interface Request {
    userAuth?: AuthContext;
  }
}

export function getAuthUser(req: Request): AuthContext {
  if (!req.userAuth) {
    throw new Error("User is not authenticated");
  }
  return req.userAuth;
}

export async function requireSession(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ")
    ? header.slice("Bearer ".length).trim()
    : null;

  if (!token) {
    res.status(401).json({ error: "Unauthorized", success: false });
    return;
  }

  try {
    const authInfo = await descopeClient.validateSession(token);
    if (!authInfo || !authInfo.token) {
      res.status(401).json({ error: "Unauthorized", success: false });
      return;
    }

    const claims = authInfo.token as Record<string, unknown>;
    const authUserId = String(claims.sub ?? "").trim();

    if (!authUserId) {
      res.status(401).json({ error: "Unauthorized: Missing user identity", success: false });
      return;
    }

    const email = typeof claims.email === "string" ? claims.email : undefined;
    const user = await ensureUser({ authUserId, email });

    req.userAuth = {
      authUserId,
      email,
      name: typeof claims.name === "string" ? claims.name : undefined,
      userId: user.id,
      token: claims,
    };

    next();
  } catch (err) {
    console.error("requireSession error:", err);
    res.status(401).json({ error: "session expired" });
  }
}
