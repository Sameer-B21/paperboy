import {
  createEpisode,
  getEpisodeBySourceMessageId,
  listEpisodesForDay,
  updateEpisode,
} from "../../db/queries/episodes.sql.js";
import { listNewsletters } from "../../db/queries/newsletters.sql.js";
import { listUsers } from "../../db/queries/users.sql.js";
import { uploadAudio } from "../../services/storage/uploadAudio.js";
import { buildDailyDigestScript } from "../../services/summarize/chatgptDigest.js";
import { generateAudio } from "../../services/tts/generateAudio.js";
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
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const dayKey = startOfDay.toISOString().slice(0, 10);
  const dateLabel = formatDateLabel(startOfDay);

  const digestKey = `digest-${dayKey}`;
  const existing = await getEpisodeBySourceMessageId(userId, digestKey);
  if (existing) {
    return;
  }

  const episodes = await listEpisodesForDay(
    userId,
    startOfDay.toISOString(),
    endOfDay.toISOString()
  );
  if (episodes.length === 0) {
    return;
  }
  console.log("Found episodes for digest", { userId, dayKey, count: episodes.length });

  const newsletters = await listNewsletters(userId);
  const newsletterMap = new Map(newsletters.map((newsletter) => [newsletter.id, newsletter]));

  const grouped = new Map<string, string[]>();
  episodes.forEach((episode) => {
    const key = episode.newsletterId ?? "unknown";
    const next = grouped.get(key) ?? [];
    if (episode.body) {
      next.push(episode.body);
    }
    grouped.set(key, next);
  });
  console.log("Grouped episodes for digest", { userId, dayKey, groups: grouped.size });

  const items = Array.from(grouped.entries())
    .map(([newsletterId, bodies]) => {
      const newsletter = newsletterMap.get(newsletterId);
      const label = newsletter?.name ?? newsletter?.sender ?? "Newsletter";
      return {
        subject: label,
        body: bodies.join("\n\n"),
      };
    })
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
    const { summary, script } = await buildDailyDigestScript({ dateLabel, items });
    await updateEpisode(digestEpisode.id, { summary, script });

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
