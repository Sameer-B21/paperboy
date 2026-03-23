import {
  createEpisode,
  getEpisodeBySourceMessageId,
  listEpisodesForDay,
  listEpisodesSince,
  updateEpisode,
} from "../../db/queries/episodes.sql.js";
import { listNewsletters } from "../../db/queries/newsletters.sql.js";
import { getUserById, listUsers } from "../../db/queries/users.sql.js";
import { uploadAudio } from "../../services/storage/uploadAudio.js";
import { buildDailyDigestScript } from "../../services/summarize/geminiDigest.js";
import { generateAudio } from "../../services/tts/generateAudio.js";
import { getAudioDurationSeconds } from "../../utils/audio.js";
import { logger } from "../../utils/logger.js";
import { env } from "../../config/env.js";

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
  options: { force?: boolean; voice?: string } = {}
): Promise<string | null> {
  const resolvedVoice = options.voice?.trim() || "rachel";
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
    const digestEpisode =
      existing ??
      (await createEpisode({
        userId,
        newsletterId: null,
        subject: `Daily Newsletter Digest - ${dateLabel}`,
        sourceMessageId: digestKey,
        body: null,
        voice: resolvedVoice,
      }));
    await updateEpisode(digestEpisode.id, {
      subject: `Daily Newsletter Digest - ${dateLabel}`,
      body: null,
      summary: `No newsletters were imported for ${dateLabel}.`,
      script:
        `There were no newsletters to summarize for ${dateLabel}. ` +
        "Sync your inbox and try again later.",
      audioPath: null,
      audioDurationSeconds: null,
      voice: resolvedVoice,
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
    const digestEpisode =
      existing ??
      (await createEpisode({
        userId,
        newsletterId: null,
        subject: `Daily Newsletter Digest - ${dateLabel}`,
        sourceMessageId: digestKey,
        body: null,
        voice: resolvedVoice,
      }));
    await updateEpisode(digestEpisode.id, {
      subject: `Daily Newsletter Digest - ${dateLabel}`,
      body: null,
      summary: `No newsletters were imported for ${dateLabel}.`,
      script:
        `There were no newsletters to summarize for ${dateLabel}. ` +
        "Sync your inbox and try again later.",
      audioPath: null,
      audioDurationSeconds: null,
      voice: resolvedVoice,
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
      audioDurationSeconds: null,
      voice: resolvedVoice,
    });
  }

  try {
    // Build the daily digest script
    const user = await getUserById(userId);
    const durationMinutes = user?.podcastDurationMinutes ?? 8;
    const { summary, script } = await buildDailyDigestScript({ dateLabel, items, durationMinutes });
    await updateEpisode(digestEpisode.id, { summary, script, voice: resolvedVoice });

    // Generate audio and upload
    const audioBuffer = await generateAudio(script, resolvedVoice);
    const audioDurationSeconds = await getAudioDurationSeconds(audioBuffer);
    const audioPath = await uploadAudio(digestEpisode.id, audioBuffer);
    await updateEpisode(digestEpisode.id, { audioPath, audioDurationSeconds });
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
