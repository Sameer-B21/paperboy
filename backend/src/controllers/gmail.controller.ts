import type { Request, Response } from "express";

import { listNewsletters, updateNewsletterSelection } from "../db/queries/newsletters.sql.js";
import { enqueueGmailDiscovery, enqueueNewsletterIngest } from "../jobs/workers/gmailIngest.worker.js";
import { AppError } from "../utils/errors.js";
import { requireString } from "../utils/validate.js";

//reads user id from request headers or query parameters and returns it
function readUserId(req: Request): string {
  const userId = req.header("x-user-id") ?? req.query.userId;
  if (typeof userId !== "string") {
    throw new AppError("x-user-id header is required.", 400);
  }
  return userId;
}

//initiates Gmail synchronization for the authenticated user
export async function syncGmail(req: Request, res: Response) {
  const userId = readUserId(req);
  const result = await enqueueGmailDiscovery(userId);
  res.json(result);
}

//lists newsletters for the authenticated user
export async function listUserNewsletters(req: Request, res: Response) {
  const userId = readUserId(req);
  const newsletters = await listNewsletters(userId);
  res.json({ newsletters });
}

//updates newsletter selection for the authenticated user
export async function updateNewsletter(req: Request, res: Response) {
  const userId = readUserId(req);
  //find newsletter based on its id and update its selection status
  const newsletterId = requireString(req.params.newsletterId, "newsletterId");
  const { selected } = req.body ?? {};
  if (typeof selected !== "boolean") {
    res.status(400).json({ error: "selected must be boolean." });
    return;
  }
  //update selection in db
  const updated = await updateNewsletterSelection(userId, newsletterId, selected);
  if (updated.selected) {
    void enqueueNewsletterIngest(userId, updated.sender);
  }
  res.json({ newsletter: updated });
}
