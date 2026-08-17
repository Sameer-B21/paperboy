import type { Request, Response } from "express";

import { getUserById, updateUser } from "../db/queries/users.sql.js";
import { deleteAccount } from "../services/security/accountDeletion.js";
import { AppError } from "../utils/errors.js";

//the verified user id is set by the requireUser middleware from the session token
function readUserId(req: Request): string {
  if (!req.userId) {
    throw new AppError("Authentication required.", 401);
  }
  return req.userId;
}

export async function updateUserPreferences(req: Request, res: Response) {
  const userId = readUserId(req);
  const { podcastDurationMinutes, digestUtcHour } = req.body ?? {};
  const updates: { podcastDurationMinutes?: number; digestUtcHour?: number } = {};
  if (podcastDurationMinutes !== undefined) {
    const parsed = Number(podcastDurationMinutes);
    if (!Number.isFinite(parsed) || parsed < 1 || parsed > 60) {
      res.status(400).json({ error: "podcastDurationMinutes must be a number between 1 and 60." });
      return;
    }
    updates.podcastDurationMinutes = parsed;
  }
  if (digestUtcHour !== undefined) {
    const parsed = Number(digestUtcHour);
    if (!Number.isInteger(parsed) || parsed < 0 || parsed > 23) {
      res.status(400).json({ error: "digestUtcHour must be an integer between 0 and 23." });
      return;
    }
    updates.digestUtcHour = parsed;
  }
  if (Object.keys(updates).length > 0) {
    await updateUser(userId, updates);
  }
  res.json({ ok: true });
}

export async function getCurrentUser(req: Request, res: Response) {
  const userId = readUserId(req);
  const user = await getUserById(userId);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({ user });
}

//permanently deletes the account: revokes Gmail access, wipes audio and rows
export async function deleteCurrentUser(req: Request, res: Response) {
  const userId = readUserId(req);
  await deleteAccount(userId);
  res.json({ ok: true });
}
