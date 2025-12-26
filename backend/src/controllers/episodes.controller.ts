import type { Request, Response } from "express";

import { getEpisode, listEpisodes } from "../db/queries/episodes.sql.js";
import { downloadAudio } from "../services/storage/uploadAudio.js";
import { env } from "../config/env.js";
import { AppError } from "../utils/errors.js";

function readUserId(req: Request): string {
  const userId = req.header("x-user-id") ?? req.query.userId;
  if (typeof userId !== "string") {
    throw new AppError("x-user-id header is required.", 400);
  }
  return userId;
}

export async function listBriefs(req: Request, res: Response) {
  const userId = readUserId(req);
  const episodes = await listEpisodes(userId);
  const payload = episodes.map((episode) => ({
    id: episode.id,
    subject: episode.subject,
    status: episode.status,
    createdAt: episode.createdAt,
  }));
  res.json({ episodes: payload });
}

export async function getBrief(req: Request, res: Response) {
  readUserId(req);
  const episode = await getEpisode(req.params.episodeId);
  if (!episode) {
    res.status(404).json({ error: "Episode not found." });
    return;
  }
  res.json({
    id: episode.id,
    subject: episode.subject,
    summary: episode.summary,
    script: episode.script,
    status: episode.status,
    audioUrl: episode.audioPath ? `${env.BASE_URL}/briefs/${episode.id}/audio` : null,
    createdAt: episode.createdAt,
  });
}

export async function getBriefAudio(req: Request, res: Response) {
  readUserId(req);
  const episode = await getEpisode(req.params.episodeId);
  if (!episode || !episode.audioPath) {
    res.status(404).json({ error: "Audio not found." });
    return;
  }
  const audio = await downloadAudio(episode.audioPath);
  res.setHeader("Content-Type", audio.contentType ?? "text/plain; charset=utf-8");
  res.send(audio.data);
}
