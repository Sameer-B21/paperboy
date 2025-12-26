import { jobQueue } from "../queue.js";
import { discoverNewslettersForUser, ingestNewsletterForUser } from "../../services/gmail/gmailSync.js";
import { summarizeEpisode } from "./summarize.worker.js";
import { generateEpisodeAudio } from "./tts.worker.js";
import { updateEpisode } from "../../db/queries/episodes.sql.js";

export async function enqueueGmailDiscovery(userId: string): Promise<{ discovered: number }> {
  const discovered = await discoverNewslettersForUser(userId);
  return { discovered };
}

export async function enqueueNewsletterIngest(
  userId: string,
  senderEmail: string
): Promise<{ queued: number }> {
  const seeds = await ingestNewsletterForUser(userId, senderEmail);
  if (seeds.length === 0) {
    return { queued: 0 };
  }

  seeds.forEach((seed) => {
    jobQueue.add(async () => {
      try {
        const { script } = await summarizeEpisode({
          episodeId: seed.episodeId,
          subject: seed.subject,
          body: seed.body,
        });
        await generateEpisodeAudio({
          episodeId: seed.episodeId,
          script,
        });
      } catch (error) {
        await updateEpisode(seed.episodeId, { status: "failed" });
      }
    });
  });

  return { queued: seeds.length };
}
