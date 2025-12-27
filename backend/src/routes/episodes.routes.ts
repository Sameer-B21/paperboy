import { Router } from "express";

import {
  generateDailyBrief,
  getLatestDailyBrief,
  getBrief,
  getBriefAudio,
  listBriefs,
} from "../controllers/episodes.controller.js";

export const episodesRouter = Router();

episodesRouter.get("/", listBriefs);
episodesRouter.post("/daily", generateDailyBrief);
episodesRouter.get("/daily/latest", getLatestDailyBrief);
episodesRouter.get("/:episodeId", getBrief);
episodesRouter.get("/:episodeId/audio", getBriefAudio);
