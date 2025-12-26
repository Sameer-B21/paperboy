import { updateEpisode } from "../../db/queries/episodes.sql.js";
import { buildPodcastScript } from "../../services/summarize/buildPodcastScript.js";
import { summarizeNewsletter } from "../../services/summarize/summarizeNewsletter.js";

export async function summarizeEpisode(payload: {
  episodeId: string;
  subject: string;
  body: string;
}): Promise<{ summary: string; script: string }> {
  const summary = summarizeNewsletter(payload.body);
  const script = buildPodcastScript({ subject: payload.subject, summary });

  await updateEpisode(payload.episodeId, {
    summary,
    script,
    status: "processing",
  });

  return { summary, script };
}
