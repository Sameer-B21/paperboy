import { Router } from "express";

import {
  getGoogleAuthUrl,
  handleGoogleCallback,
} from "../controllers/auth.controller.js";

export const authRouter = Router();

//google auth routes

authRouter.get("/google", getGoogleAuthUrl);
authRouter.get("/google/callback", handleGoogleCallback);
