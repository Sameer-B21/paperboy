import type { Request, Response } from "express";

import { enqueueGmailDiscovery, enqueueNewsletterIngest } from "../jobs/workers/gmailIngest.worker.js";
import { listNewsletters, updateNewsletterSelection } from "../db/queries/newsletters.sql.js";
import { AppError } from "../utils/errors.js";
import { requireString } from "../utils/validate.js";

function readUserId(req: Request): string {
  const userId = req.header("x-user-id") ?? req.query.userId;
  if (typeof userId !== "string") {
    throw new AppError("x-user-id header is required.", 400);
  }
  return userId;
}

export async function syncGmail(req: Request, res: Response) {
  const userId = readUserId(req);
  const result = await enqueueGmailDiscovery(userId);
  res.json(result);
}

export async function listUserNewsletters(req: Request, res: Response) {
  const userId = readUserId(req);
  const newsletters = await listNewsletters(userId);
  res.json({ newsletters });
}

export async function updateNewsletter(req: Request, res: Response) {
  const userId = readUserId(req);
  const newsletterId = requireString(req.params.newsletterId, "newsletterId");
  const { selected } = req.body ?? {};
  if (typeof selected !== "boolean") {
    res.status(400).json({ error: "selected must be boolean." });
    return;
  }
  const updated = await updateNewsletterSelection(userId, newsletterId, selected);
  if (updated.selected) {
    void enqueueNewsletterIngest(userId, updated.sender);
  }
  res.json({ newsletter: updated });
}
