import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { env } from "../config/env.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export const SESSION_TOKEN_TTL = "30d";

export function issueSessionToken(userId: string): string {
  return jwt.sign({}, env.AUTH_JWT_SECRET, {
    subject: userId,
    expiresIn: SESSION_TOKEN_TTL,
  });
}

//authenticates the request from a signed session token; the user id is only
//ever taken from the verified token, never from headers or query params
export function requireUser(req: Request, res: Response, next: NextFunction) {
  const header = req.header("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;
  if (!token) {
    res.status(401).json({ error: "Authentication required. Please sign in." });
    return;
  }
  try {
    const payload = jwt.verify(token, env.AUTH_JWT_SECRET);
    if (typeof payload === "string" || typeof payload.sub !== "string") {
      throw new Error("Malformed token payload");
    }
    req.userId = payload.sub;
    next();
  } catch {
    res.status(401).json({ error: "Session expired. Please sign in again." });
  }
}
