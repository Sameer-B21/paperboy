import type { Request, Response } from "express";
import { env } from "../config/env.js";
import {
  getEpisode as getEpisodeById,
  getLatestDailyDigest,
  listEpisodes as listEpisodesByUser,
  updateEpisode,
} from "../db/queries/episodes.sql.js";
import { listNewsletters } from "../db/queries/newsletters.sql.js";
import { jobQueue } from "../jobs/queue.js";
import {
  prepareDailyDigestEpisode,
  runDailyDigestForUser,
} from "../jobs/workers/dailyDigest.worker.js";
import { ingestNewsletterForUser } from "../services/gmail/gmailSync.js";
import { downloadAudio } from "../services/storage/uploadAudio.js";
import { AppError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";
import { normalizeTtsVoice } from "../utils/tts.js";

function buildEpisodeAudioUrl(episodeId: string, cacheKey?: string): string {
  const url = new URL(`${env.BASE_URL}/episodes/${episodeId}/audio`);
  if (cacheKey) {
    url.searchParams.set("v", cacheKey);
  }
  return url.toString();
}

//the verified user id is set by the requireUser middleware from the session token
function readUserId(req: Request): string {
  if (!req.userId) {
    throw new AppError("Authentication required.", 401);
  }
  return req.userId;
}

//lists episodes for the authenticated user
export async function listEpisodes(req: Request, res: Response) {
  const userId = readUserId(req);
  const defaultVoice = env.OPENAI_TTS_VOICE ?? "en-US-Chirp3-HD-Leda";
  //get episodes from db
  const episodes = await listEpisodesByUser(userId);
  const payload = episodes.map((episode) => ({
    id: episode.id,
    subject: episode.subject,
    status: episode.status,
    voice: episode.voice ?? defaultVoice,
    createdAt: episode.createdAt,
    sourceMessageId: episode.sourceMessageId,
  }));
  res.json({ episodes: payload });
}

//gets a specific episode by id for the authenticated user
export async function getEpisode(req: Request, res: Response) {
  const userId = readUserId(req);
  //get episode from db
  const episode = await getEpisodeById(req.params.episodeId);
  if (!episode || episode.userId !== userId) {
    res.status(404).json({ error: "Episode not found." });
    return;
  }
  const defaultVoice = env.OPENAI_TTS_VOICE ?? "en-US-Chirp3-HD-Leda";
  res.json({
    id: episode.id,
    subject: episode.subject,
    summary: episode.summary,
    script: episode.script,
    status: episode.status,
    voice: episode.voice ?? defaultVoice,
    audioUrl: episode.audioPath ? buildEpisodeAudioUrl(episode.id, episode.updatedAt) : null,
    audioDurationSeconds: episode.audioDurationSeconds,
    createdAt: episode.createdAt,
  });
}

//streams the audio file for a specific episode
export async function getEpisodeAudio(req: Request, res: Response) {
  const userId = readUserId(req);
  //get ep from db
  const episode = await getEpisodeById(req.params.episodeId);
  if (!episode || episode.userId !== userId || !episode.audioPath) {
    res.status(404).json({ error: "Audio not found." });
    return;
  }
  //download audio from storage
  const audio = await downloadAudio(episode.audioPath);
  res.setHeader("Content-Type", audio.contentType ?? "audio/mpeg");
  res.setHeader("Cache-Control", "private, max-age=3600");
  res.send(audio.data);
}

//kicks off generation in the background and returns the episode to poll —
//the full pipeline (Gmail sync + LLM + TTS) takes minutes, far longer than
//hosting proxies allow a request to stay open
export async function generateDailyEpisode(req: Request, res: Response) {
  const userId = readUserId(req);
  const requestedVoice = normalizeTtsVoice(req.body?.voice);
  const now = new Date();

  //create (or reset) today's digest episode so the app has an id to poll
  const episode = await prepareDailyDigestEpisode(userId, now, requestedVoice);

  jobQueue.add(async () => {
    // Force latest sync: ingest active newsletters so the digest sees the
    // latest inbound emails before generating.
    try {
      const newsletters = await listNewsletters(userId);
      const activeNewsletters = newsletters.filter((n) => n.selected);
      try {
        await Promise.all(
          activeNewsletters.map((sub) => ingestNewsletterForUser(userId, sub.sender))
        );
      } catch (error: any) {
        if (error instanceof AppError && error.status === 401) {
          logger.warn(`Gmail connection expired for user ${userId} during daily episode ingestion.`);
        } else {
          logger.warn(`Failed syncing latest emails for user ${userId}: ${error?.message}`);
        }
      }

      await runDailyDigestForUser(userId, now, {
        force: true,
        voice: requestedVoice,
      });
    } catch (error) {
      logger.error(`Daily episode generation failed for user ${userId}`, { error });
      await updateEpisode(episode.id, { status: "failed" }).catch(() => undefined);
    }
  });

  const defaultVoice = env.OPENAI_TTS_VOICE ?? "en-US-Chirp3-HD-Leda";
  res.status(202).json({
    id: episode.id,
    subject: episode.subject,
    summary: episode.summary,
    script: episode.script,
    status: episode.status,
    voice: episode.voice ?? defaultVoice,
    audioUrl: null,
    audioDurationSeconds: null,
    createdAt: episode.createdAt,
  });
}

//gets the latest daily episode for the authenticated user
export async function getLatestDailyEpisode(req: Request, res: Response) {
  const userId = readUserId(req);
  //get the latest daily digest episode from db
  const episode = await getLatestDailyDigest(userId);
  if (!episode) {
    res.status(404).json({ error: "Daily brief not found." });
    return;
  }
  const defaultVoice = env.OPENAI_TTS_VOICE ?? "en-US-Chirp3-HD-Leda";
  res.json({
    id: episode.id,
    subject: episode.subject,
    summary: episode.summary,
    script: episode.script,
    status: episode.status,
    voice: episode.voice ?? defaultVoice,
    audioUrl: episode.audioPath ? buildEpisodeAudioUrl(episode.id, episode.updatedAt) : null,
    audioDurationSeconds: episode.audioDurationSeconds,
    createdAt: episode.createdAt,
  });
}
