import { Router } from "express";

import {
  getGoogleAuthUrl,
  handleGoogleCallback,
  logout,
} from "../controllers/auth.controller.js";
import { requireUser } from "../middleware/requireUser.js";

export const authRouter = Router();

//google auth routes

authRouter.get("/google", getGoogleAuthUrl);
authRouter.get("/google/callback", handleGoogleCallback);
authRouter.post("/logout", requireUser, logout);
