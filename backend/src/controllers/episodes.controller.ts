import type { Request, Response } from "express";
import { env } from "../config/env.js";
import {
  getEpisode as getEpisodeById,
  getLatestDailyDigest,
  listEpisodes as listEpisodesByUser,
} from "../db/queries/episodes.sql.js";
import { runDailyDigestForUser } from "../jobs/workers/dailyDigest.worker.js";
import { downloadAudio } from "../services/storage/uploadAudio.js";
import { AppError } from "../utils/errors.js";
import { normalizeTtsVoice } from "../utils/tts.js";

function buildEpisodeAudioUrl(episodeId: string, userId: string, cacheKey?: string): string {
  const url = new URL(`${env.BASE_URL}/episodes/${episodeId}/audio`);
  url.searchParams.set("userId", userId);
  if (cacheKey) {
    url.searchParams.set("v", cacheKey);
  }
  return url.toString();
}

//reads user id from request headers or query parameters and returns it
function readUserId(req: Request): string {
  const userId =
    req.header("x-user-id") ??
    req.query.userId ??
    req.query.userid ??
    req.query.userID ??
    req.query.userld;
  if (typeof userId !== "string") {
    throw new AppError("x-user-id header is required.", 400);
  }
  return userId;
}

//lists episodes for the authenticated user
export async function listEpisodes(req: Request, res: Response) {
  const userId = readUserId(req);
  const defaultVoice = "rachel";
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
  if (!episode) {
    res.status(404).json({ error: "Episode not found." });
    return;
  }
  const defaultVoice = "rachel";
  res.json({
    id: episode.id,
    subject: episode.subject,
    summary: episode.summary,
    script: episode.script,
    status: episode.status,
    voice: episode.voice ?? defaultVoice,
    audioUrl: episode.audioPath
      ? buildEpisodeAudioUrl(episode.id, userId, episode.updatedAt)
      : null,
    audioDurationSeconds: episode.audioDurationSeconds,
    createdAt: episode.createdAt,
  });
}

//streams the audio file for a specific episode
export async function getEpisodeAudio(req: Request, res: Response) {
  readUserId(req);
  //get ep from db
  const episode = await getEpisodeById(req.params.episodeId);
  if (!episode || !episode.audioPath) {
    res.status(404).json({ error: "Audio not found." });
    return;
  }
  //download audio from storage
  const audio = await downloadAudio(episode.audioPath);
  res.setHeader("Content-Type", audio.contentType ?? "text/plain; charset=utf-8");
  res.send(audio.data);
}

export async function generateDailyEpisode(req: Request, res: Response) {
  const userId = readUserId(req);
  const requestedVoice = normalizeTtsVoice(req.body?.voice);
  const now = new Date();
  const episodeId = await runDailyDigestForUser(userId, now, {
    force: true,
    voice: requestedVoice,
  });
  if (!episodeId) {
    res.status(204).send();
    return;
  }

  const episode = await getEpisodeById(episodeId);
  if (!episode) {
    res.status(404).json({ error: "Episode not found." });
    return;
  }

  const defaultVoice = "rachel";
  res.json({
    id: episode.id,
    subject: episode.subject,
    summary: episode.summary,
    script: episode.script,
    status: episode.status,
    voice: episode.voice ?? defaultVoice,
    audioUrl: episode.audioPath
      ? buildEpisodeAudioUrl(episode.id, userId, episode.updatedAt)
      : null,
    audioDurationSeconds: episode.audioDurationSeconds,
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
  const defaultVoice = "rachel";
  res.json({
    id: episode.id,
    subject: episode.subject,
    summary: episode.summary,
    script: episode.script,
    status: episode.status,
    voice: episode.voice ?? defaultVoice,
    audioUrl: episode.audioPath
      ? buildEpisodeAudioUrl(episode.id, userId, episode.updatedAt)
      : null,
    audioDurationSeconds: episode.audioDurationSeconds,
    createdAt: episode.createdAt,
  });
}
