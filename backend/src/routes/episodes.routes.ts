import { Router } from "express";

import { getBrief, getBriefAudio, listBriefs } from "../controllers/episodes.controller.js";

export const episodesRouter = Router();

episodesRouter.get("/", listBriefs);
episodesRouter.get("/:episodeId", getBrief);
episodesRouter.get("/:episodeId/audio", getBriefAudio);
