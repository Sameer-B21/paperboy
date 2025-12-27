import { Router } from "express";

import {
  generateDailyEpisode,
  getEpisode,
  getEpisodeAudio,
  getLatestDailyEpisode,
  listEpisodes,
} from "../controllers/episodes.controller.js";

export const episodesRouter = Router();

//episode routes

episodesRouter.get("/", listEpisodes);
episodesRouter.post("/daily", generateDailyEpisode);
episodesRouter.get("/daily/latest", getLatestDailyEpisode);
episodesRouter.get("/:episodeId", getEpisode);
episodesRouter.get("/:episodeId/audio", getEpisodeAudio);
