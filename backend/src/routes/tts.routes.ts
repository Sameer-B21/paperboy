import { Router } from "express";

import { previewTts } from "../controllers/tts.controller.js";

export const ttsRouter = Router();

ttsRouter.get("/preview", previewTts);
