import type { Request, Response } from "express";

import { updateUser } from "../db/queries/users.sql.js";
import { AppError } from "../utils/errors.js";

function readUserId(req: Request): string {
  const userId = req.header("x-user-id") ?? req.query.userId;
  if (typeof userId !== "string") {
    throw new AppError("x-user-id header is required.", 400);
  }
  return userId;
}

export async function updateUserPreferences(req: Request, res: Response) {
  const userId = readUserId(req);
  const { podcastDurationMinutes } = req.body ?? {};
  if (podcastDurationMinutes !== undefined) {
    const parsed = Number(podcastDurationMinutes);
    if (!Number.isFinite(parsed) || parsed < 1 || parsed > 60) {
      res.status(400).json({ error: "podcastDurationMinutes must be a number between 1 and 60." });
      return;
    }
    await updateUser(userId, { podcastDurationMinutes: parsed });
  }
  res.json({ ok: true });
}
