import { Router } from "express";

import {
  getGoogleAuthUrl,
  handleGoogleCallback,
  signupWithEmail,
} from "../controllers/auth.controller.js";

export const authRouter = Router();

//google auth routes

authRouter.get("/google", getGoogleAuthUrl);
authRouter.get("/google/callback", handleGoogleCallback);
authRouter.post("/signup", signupWithEmail);
