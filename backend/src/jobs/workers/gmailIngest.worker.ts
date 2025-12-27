import { updateEpisode } from "../../db/queries/episodes.sql.js";
import { discoverNewslettersForUser, ingestNewsletterForUser } from "../../services/gmail/gmailSync.js";
import { jobQueue } from "../queue.js";

//enqueue a job to discover newsletters for a user
export async function enqueueGmailDiscovery(userId: string): Promise<{ discovered: number }> {
  const discovered = await discoverNewslettersForUser(userId);
  return { discovered };
}

//enqueue jobs to ingest newsletters for a user
export async function enqueueNewsletterIngest(
  userId: string,
  senderEmail: string
): Promise<{ queued: number }> {
  //ingest newsletters and get seeds
  const seeds = await ingestNewsletterForUser(userId, senderEmail);
  if (seeds.length === 0) {
    return { queued: 0 };
  }

  //for each seed add a job to the queue
  seeds.forEach((seed) => {
    jobQueue.add(async () => {
      try {
        // Mark ingestion complete without generating scripts for non-digests
        await updateEpisode(seed.episodeId, {});
      } catch (error) {
        await updateEpisode(seed.episodeId, {});
      }
    });
  });

  return { queued: seeds.length };
}
