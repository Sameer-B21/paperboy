import {
  createEpisode,
  getEpisodeBySourceMessageId,
  listEpisodesForDay,
  listEpisodesSince,
  updateEpisode,
} from "../../db/queries/episodes.sql.js";
import { listNewsletters } from "../../db/queries/newsletters.sql.js";
import { getUserById, listUsers } from "../../db/queries/users.sql.js";
import { ingestNewsletterForUser } from "../../services/gmail/gmailSync.js";
import { uploadAudio } from "../../services/storage/uploadAudio.js";
import { buildDailyDigestScript } from "../../services/summarize/chatgptDigest.js";
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

//creates today's digest episode (or resets the existing one back to "queued")
//so the app has an episode id to poll while generation runs in the background
export async function prepareDailyDigestEpisode(
  userId: string,
  now = new Date(),
  voice?: string
) {
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const dayKey = startOfDay.toISOString().slice(0, 10);
  const digestKey = `digest-${dayKey}`;
  const dateLabel = formatDateLabel(now);
  const resolvedVoice = voice?.trim() || env.OPENAI_TTS_VOICE || "en-US-Chirp3-HD-Leda";

  const existing = await getEpisodeBySourceMessageId(userId, digestKey);
  if (!existing) {
    return createEpisode({
      userId,
      newsletterId: null,
      subject: `Daily Newsletter Digest - ${dateLabel}`,
      sourceMessageId: digestKey,
      body: null,
      voice: resolvedVoice,
    });
  }
  return updateEpisode(existing.id, {
    summary: null,
    script: null,
    audioPath: null,
    audioDurationSeconds: null,
    status: "queued",
    voice: resolvedVoice,
  });
}

//function to run daily digest for a single user
export async function runDailyDigestForUser(
  userId: string,
  now = new Date(),
  options: { force?: boolean; voice?: string } = {}
): Promise<string | null> {
  const resolvedVoice = options.voice?.trim() || env.OPENAI_TTS_VOICE || "en-US-Chirp3-HD-Leda";
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
  let episodes = options.force
    ? await listEpisodesSince(userId, windowStart.toISOString())
    : await listEpisodesForDay(
        userId,
        startOfDay.toISOString(),
        endOfDay.toISOString()
      );

  // Filter out episodes from newsletters that the user has since disabled
  const newsletters = await listNewsletters(userId);
  const activeNewsletterIds = new Set(newsletters.filter((n) => n.selected).map((n) => n.id));
  episodes = episodes.filter((ep) => ep.newsletterId && activeNewsletterIds.has(ep.newsletterId));

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
      status: "completed",
      voice: resolvedVoice,
    });
    return digestEpisode.id;
  }
  // console.log("Found episodes for digest", { userId, dayKey, count: episodes.length });

  // Map active newsletters
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
      status: "completed",
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
    const userName = user?.name ? user.name.split(' ')[0] : 'there';
    const { summary, script } = await buildDailyDigestScript({ dateLabel, items, durationMinutes, userName });
    await updateEpisode(digestEpisode.id, { summary, script, voice: resolvedVoice });

    // Generate audio and upload
    const audioBuffer = await generateAudio(script, resolvedVoice);
    const audioDurationSeconds = await getAudioDurationSeconds(audioBuffer);
    const audioPath = await uploadAudio(digestEpisode.id, audioBuffer);
    await updateEpisode(digestEpisode.id, { audioPath, audioDurationSeconds, status: "completed" });
  } catch (error) {
    logger.error("Daily digest failed", { error });
    await updateEpisode(digestEpisode.id, { status: "failed" }).catch(() => undefined);
  }

  return digestEpisode.id;
}

//pulls in the latest emails from the user's active newsletters, the same way
//the "generate now" button does, so the scheduled digest isn't built from an
//empty inbox
async function ingestActiveNewsletters(userId: string): Promise<void> {
  try {
    const newsletters = await listNewsletters(userId);
    const active = newsletters.filter((newsletter) => newsletter.selected);
    await Promise.all(active.map((newsletter) => ingestNewsletterForUser(userId, newsletter.sender)));
  } catch (error) {
    logger.warn(`Failed syncing latest emails for user ${userId} before scheduled digest`, { error });
  }
}

//runs the daily digest for every user whose chosen delivery hour is now.
//users who never picked a time (digestUtcHour null) fall back to 7 AM server time.
export async function runDailyDigestForDueUsers(now = new Date()): Promise<void> {
  const users = await listUsers();
  const utcHour = now.getUTCHours();
  const serverHour = now.getHours();
  const dueUsers = users.filter((user) =>
    user.digestUtcHour != null ? user.digestUtcHour === utcHour : serverHour === 7
  );

  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const digestKey = `digest-${startOfDay.toISOString().slice(0, 10)}`;

  for (const user of dueUsers) {
    //today's digest already exists, so a restart during the delivery hour
    //can't run up a second round of OpenAI + TTS charges
    const existing = await getEpisodeBySourceMessageId(user.id, digestKey);
    if (existing) {
      continue;
    }
    await ingestActiveNewsletters(user.id);
    //force: the delivery hour is rarely the end of the day, so the digest
    //covers the last 24 hours rather than only what arrived since midnight
    await runDailyDigestForUser(user.id, now, { force: true });
  }
}
