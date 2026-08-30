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

export const AUDIO_TOKEN_TTL = "24h";

//short-lived token embedded in an episode's audio URL, scoped to that one
//episode; HTML5 <audio> on web can't send Authorization headers, so the URL
//itself must carry the proof
export function issueAudioToken(userId: string, episodeId: string): string {
  return jwt.sign({ scope: "audio", episodeId }, env.AUTH_JWT_SECRET, {
    subject: userId,
    expiresIn: AUDIO_TOKEN_TTL,
  });
}

//auth for the audio route: a normal Bearer session token, or the signed
//episode-scoped token from the URL's ?t= param (for web media elements)
export function requireUserOrSignedAudioUrl(req: Request, res: Response, next: NextFunction) {
  const header = req.header("authorization");
  if (header?.startsWith("Bearer ")) {
    requireUser(req, res, next);
    return;
  }
  const urlToken = typeof req.query.t === "string" ? req.query.t : null;
  if (!urlToken) {
    res.status(401).json({ error: "Authentication required. Please sign in." });
    return;
  }
  try {
    const payload = jwt.verify(urlToken, env.AUTH_JWT_SECRET);
    if (
      typeof payload === "string" ||
      typeof payload.sub !== "string" ||
      payload.scope !== "audio" ||
      payload.episodeId !== req.params.episodeId
    ) {
      throw new Error("Malformed audio token payload");
    }
    req.userId = payload.sub;
    next();
  } catch {
    res.status(401).json({ error: "Audio link expired. Please refresh." });
  }
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
