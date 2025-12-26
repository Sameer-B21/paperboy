import { Router } from "express";

import {
  generateDailyBrief,
  getBrief,
  getBriefAudio,
  listBriefs,
} from "../controllers/episodes.controller.js";

export const episodesRouter = Router();

episodesRouter.get("/", listBriefs);
episodesRouter.post("/daily", generateDailyBrief);
episodesRouter.get("/:episodeId", getBrief);
episodesRouter.get("/:episodeId/audio", getBriefAudio);
