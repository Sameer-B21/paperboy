import { listUsers } from "../../db/queries/users.sql.js";
import {
  createEpisode,
  getEpisodeBySourceMessageId,
  listEpisodesSince,
  updateEpisode,
} from "../../db/queries/episodes.sql.js";
import { buildDailyDigestScript } from "../../services/summarize/chatgptDigest.js";
import { generateAudio } from "../../services/tts/generateAudio.js";
import { uploadAudio } from "../../services/storage/uploadAudio.js";
import { logger } from "../../utils/logger.js";

function formatDateLabel(date: Date): string {
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

export async function runDailyDigestForUser(
  userId: string,
  now = new Date()
): Promise<void> {
  const since = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const dayKey = now.toISOString().slice(0, 10);
  const dateLabel = formatDateLabel(now);

  const digestKey = `digest-${dayKey}`;
  const existing = await getEpisodeBySourceMessageId(userId, digestKey);
  if (existing) {
    return;
  }

  const episodes = await listEpisodesSince(userId, since);
  const items = episodes
    .map((episode) => ({ subject: episode.subject, body: episode.body ?? "" }))
    .filter((item) => item.body.trim().length > 0);

  if (items.length === 0) {
    return;
  }

  const combinedBody = items.map((item) => `${item.subject}\n${item.body}`).join("\n\n");

  const digestEpisode = await createEpisode({
    userId,
    newsletterId: null,
    subject: `Daily Newsletter Digest - ${dateLabel}`,
    sourceMessageId: digestKey,
    body: combinedBody,
  });

  try {
    await updateEpisode(digestEpisode.id, { status: "processing" });

    const { summary, script } = await buildDailyDigestScript({ dateLabel, items });
    await updateEpisode(digestEpisode.id, { summary, script, status: "processing" });

    const audioPath = await uploadAudio(digestEpisode.id, generateAudio(script));
    await updateEpisode(digestEpisode.id, { audioPath, status: "completed" });
  } catch (error) {
    logger.error("Daily digest failed", { error });
    await updateEpisode(digestEpisode.id, { status: "failed" });
  }
}

export async function runDailyDigestForAllUsers(now = new Date()): Promise<void> {
  const users = await listUsers();
  if (users.length === 0) {
    return;
  }

  for (const user of users) {
    await runDailyDigestForUser(user.id, now);
  }
}
