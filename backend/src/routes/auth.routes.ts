import { Router } from "express";

import {
  getGoogleAuthUrl,
  handleGoogleCallback,
  logout,
} from "../controllers/auth.controller.js";
import { requireUser } from "../middleware/requireUser.js";
import { asyncHandler } from "../utils/errors.js";

export const authRouter = Router();

//google auth routes

authRouter.get("/google", asyncHandler(getGoogleAuthUrl));
authRouter.get("/google/callback", asyncHandler(handleGoogleCallback));
authRouter.post("/logout", requireUser, asyncHandler(logout));
