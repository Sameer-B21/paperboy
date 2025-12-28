import {
  createEpisode,
  getEpisodeBySourceMessageId,
  listEpisodesForDay,
  listEpisodesSince,
  updateEpisode,
} from "../../db/queries/episodes.sql.js";
import { listNewsletters } from "../../db/queries/newsletters.sql.js";
import { listUsers } from "../../db/queries/users.sql.js";
import { uploadAudio } from "../../services/storage/uploadAudio.js";
import { buildDailyDigestScript } from "../../services/summarize/chatgptDigest.js";
import { generateAudio } from "../../services/tts/generateAudio.js";
import { logger } from "../../utils/logger.js";

//outputs date in a standard format for the digest title
function formatDateLabel(date: Date): string {
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

//function to run daily digest for a single user
export async function runDailyDigestForUser(
  userId: string,
  now = new Date(),
  options: { force?: boolean } = {}
): Promise<string | null> {
  // Determine time window (daily schedule uses calendar day, manual uses last 24 hours)
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);
  const windowStart = options.force ? new Date(now.getTime() - 24 * 60 * 60 * 1000) : startOfDay;
  const windowEnd = options.force ? now : endOfDay;

  //set datelabel and keys
  const dayKey = startOfDay.toISOString().slice(0, 10);
  const dateLabel = formatDateLabel(windowEnd);

  // Check if digest already exists
  const digestKey = `digest-${dayKey}`;
  const existing = await getEpisodeBySourceMessageId(userId, digestKey);
  if (existing && !options.force) {
    return null;
  }

  // Fetch episodes for the day
  const episodes = options.force
    ? await listEpisodesSince(userId, windowStart.toISOString())
    : await listEpisodesForDay(
        userId,
        startOfDay.toISOString(),
        endOfDay.toISOString()
      );
  if (episodes.length === 0) {
    if (!options.force) {
      return null;
    }
    const digestEpisode =
      existing ??
      (await createEpisode({
        userId,
        newsletterId: null,
        subject: `Daily Newsletter Digest - ${dateLabel}`,
        sourceMessageId: digestKey,
        body: null,
      }));
    await updateEpisode(digestEpisode.id, {
      subject: `Daily Newsletter Digest - ${dateLabel}`,
      body: null,
      summary: `No newsletters were imported for ${dateLabel}.`,
      script:
        `There were no newsletters to summarize for ${dateLabel}. ` +
        "Sync your inbox and try again later.",
      audioPath: null,
    });
    return digestEpisode.id;
  }
  // console.log("Found episodes for digest", { userId, dayKey, count: episodes.length });

  // Fetch newsletters and map by ID
  const newsletters = await listNewsletters(userId);
  const newsletterMap = new Map(newsletters.map((newsletter) => [newsletter.id, newsletter]));

  // Group episodes by newsletter
  const grouped = new Map<string, string[]>();
  episodes.forEach((episode) => {
    const key = episode.newsletterId ?? "unknown";
    const next = grouped.get(key) ?? [];
    if (episode.body) {
      next.push(episode.body);
    }
    grouped.set(key, next);
  });
  // console.log("Grouped episodes for digest", { userId, dayKey, groups: grouped.size });

  // Prepare items for the digest
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
    if (!options.force) {
      return null;
    }
    const digestEpisode =
      existing ??
      (await createEpisode({
        userId,
        newsletterId: null,
        subject: `Daily Newsletter Digest - ${dateLabel}`,
        sourceMessageId: digestKey,
        body: null,
      }));
    await updateEpisode(digestEpisode.id, {
      subject: `Daily Newsletter Digest - ${dateLabel}`,
      body: null,
      summary: `No newsletters were imported for ${dateLabel}.`,
      script:
        `There were no newsletters to summarize for ${dateLabel}. ` +
        "Sync your inbox and try again later.",
      audioPath: null,
    });
    return digestEpisode.id;
  }

  // Create the digest episode by combining all items
  const combinedBody = items.map((item) => `${item.subject}\n${item.body}`).join("\n\n");
  const digestEpisode =
    existing ??
    (await createEpisode({
      userId,
      newsletterId: null,
      subject: `Daily Newsletter Digest - ${dateLabel}`,
      sourceMessageId: digestKey,
      body: combinedBody,
    }));
  if (existing) {
    await updateEpisode(digestEpisode.id, {
      subject: `Daily Newsletter Digest - ${dateLabel}`,
      body: combinedBody,
      summary: null,
      script: null,
      audioPath: null,
    });
  }

  try {
    // Build the daily digest script
    const { summary, script } = await buildDailyDigestScript({ dateLabel, items });
    await updateEpisode(digestEpisode.id, { summary, script });

    // Generate audio and upload
    const audioPath = await uploadAudio(digestEpisode.id, await generateAudio(script));
    await updateEpisode(digestEpisode.id, { audioPath });
  } catch (error) {
    logger.error("Daily digest failed", { error });
  }

  return digestEpisode.id;
}

//function to run daily digest for all users
export async function runDailyDigestForAllUsers(now = new Date()): Promise<void> {
  const users = await listUsers();
  if (users.length === 0) {
    return;
  }

  for (const user of users) {
    await runDailyDigestForUser(user.id, now);
  }
}
