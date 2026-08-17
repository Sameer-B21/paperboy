import { Router } from "express";

import { previewTts } from "../controllers/tts.controller.js";
import { asyncHandler } from "../utils/errors.js";

export const ttsRouter = Router();

ttsRouter.get("/preview", asyncHandler(previewTts));
