import { Router } from "express";

import {
  deleteCurrentUser,
  getCurrentUser,
  updateUserPreferences,
} from "../controllers/users.controller.js";

export const usersRouter = Router();

usersRouter.get("/me", getCurrentUser);
usersRouter.patch("/me", updateUserPreferences);
usersRouter.delete("/me", deleteCurrentUser);
