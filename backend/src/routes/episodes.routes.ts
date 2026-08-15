import { Router } from "express";
import { ipKeyGenerator, rateLimit } from "express-rate-limit";

import {
  generateDailyEpisode,
  getEpisode,
  getEpisodeAudio,
  getLatestDailyEpisode,
  listEpisodes,
} from "../controllers/episodes.controller.js";

export const episodesRouter = Router();

//each generation costs real money (OpenAI + Google TTS), so cap how often a
//single user can trigger it
const generationLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.userId ?? ipKeyGenerator(req.ip ?? ""),
  message: { error: "Daily brief generation limit reached. Try again tomorrow." },
});

//episode routes

episodesRouter.get("/", listEpisodes);
episodesRouter.post("/daily", generationLimiter, generateDailyEpisode);
episodesRouter.get("/daily/latest", getLatestDailyEpisode);
episodesRouter.get("/:episodeId", getEpisode);
episodesRouter.get("/:episodeId/audio", getEpisodeAudio);
