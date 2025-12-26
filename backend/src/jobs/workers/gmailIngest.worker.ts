import { jobQueue } from "../queue.js";
import { syncNewslettersForUser } from "../../services/gmail/gmailSync.js";
import { summarizeEpisode } from "./summarize.worker.js";
import { generateEpisodeAudio } from "./tts.worker.js";
import { updateEpisode } from "../../db/queries/episodes.sql.js";

export async function enqueueGmailIngest(userId: string): Promise<{ queued: number }> {
  const seeds = await syncNewslettersForUser(userId);
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
