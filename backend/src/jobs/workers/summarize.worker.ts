import { updateEpisode } from "../../db/queries/episodes.sql.js";
import { buildPodcastScript } from "../../services/summarize/buildPodcastScript.js";
import { summarizeNewsletter } from "../../services/summarize/summarizeNewsletter.js";

//function to summarize an episode and build podcast script
export async function summarizeEpisode(payload: {
  episodeId: string;
  subject: string;
  body: string;
}): Promise<{ summary: string; script: string }> {
  // Generate summary from newsletter body
  const summary = summarizeNewsletter(payload.body);
  const script = buildPodcastScript({ subject: payload.subject, summary });

  // Update episode with summary and script
  await updateEpisode(payload.episodeId, {
    summary,
    script,
  });

  return { summary, script };
}
