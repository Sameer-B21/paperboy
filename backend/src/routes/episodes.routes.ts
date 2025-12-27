import { Router } from "express";

import {
  generateDailyEpisode,
  getLatestDailyEpisode,
  getEpisode,
  getEpisodeAudio,
  listEpisodes,
} from "../controllers/episodes.controller.js";

export const episodesRouter = Router();

episodesRouter.get("/", listEpisodes);
episodesRouter.post("/daily", generateDailyEpisode);
episodesRouter.get("/daily/latest", getLatestDailyEpisode);
episodesRouter.get("/:episodeId", getEpisode);
episodesRouter.get("/:episodeId/audio", getEpisodeAudio);
