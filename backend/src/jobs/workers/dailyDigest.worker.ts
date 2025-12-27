import {
  createEpisode,
  getEpisodeBySourceMessageId,
  listEpisodesForDay,
  updateEpisode,
} from "../../db/queries/episodes.sql.js";
import { listUsers } from "../../db/queries/users.sql.js";
import { uploadAudio } from "../../services/storage/uploadAudio.js";
import { buildDailyDigestScript } from "../../services/summarize/chatgptDigest.js";
import { generateAudio } from "../../services/tts/generateAudio.js";
import { logger } from "../../utils/logger.js";
import type { Episode } from "../../db/types.js";

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
): Promise<Episode | null> {
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);
  console.log("Running daily digest", { userId, startOfDay, endOfDay });

  const dayKey = startOfDay.toISOString().slice(0, 10);
  const dateLabel = formatDateLabel(startOfDay);

  const digestKey = `digest-${dayKey}`;
  const existing = await getEpisodeBySourceMessageId(userId, digestKey);
  console.log("Checked for existing digest", { userId, dayKey, exists: !!existing });
  if (existing) {
    return existing;
  }
  console.log("Generating daily digest", { userId, dayKey });

  const episodes = await listEpisodesForDay(
    userId,
    startOfDay.toISOString(),
    endOfDay.toISOString()
  );
  if (episodes.length === 0) {
    return null;
  }
  console.log("Found episodes for digest", { userId, dayKey, count: episodes.length });

  const combinedBodies = episodes
    .map((episode) => episode.body ?? "")
    .filter((body) => body.trim().length > 0)
    .join("\n\n");

  const items = [
    {
      subject: "All newsletters",
      body: combinedBodies,
    },
  ].filter((item) => item.body.trim().length > 0);

  if (items.length === 0) {
    return null;
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
    const { summary, script } = await buildDailyDigestScript({ dateLabel, items });
    await updateEpisode(digestEpisode.id, { summary, script });

    const audioPath = await uploadAudio(digestEpisode.id, generateAudio(script));
    await updateEpisode(digestEpisode.id, { audioPath, status: "completed" });
    const updated = await getEpisodeBySourceMessageId(userId, digestKey);
    return updated ?? digestEpisode;
  } catch (error) {
    logger.error("Daily digest failed", { error });
    await updateEpisode(digestEpisode.id, { status: "failed" });
    return digestEpisode;
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
