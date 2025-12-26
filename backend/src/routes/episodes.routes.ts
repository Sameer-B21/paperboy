import { Router } from "express";

import { getBrief, getBriefAudio, listBriefs } from "../controllers/briefs.controller.js";

export const briefsRouter = Router();

briefsRouter.get("/", listBriefs);
briefsRouter.get("/:episodeId", getBrief);
briefsRouter.get("/:episodeId/audio", getBriefAudio);
