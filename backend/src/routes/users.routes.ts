import { Router } from "express";

import {
  deleteCurrentUser,
  getCurrentUser,
  updateUserPreferences,
} from "../controllers/users.controller.js";
import { asyncHandler } from "../utils/errors.js";

export const usersRouter = Router();

usersRouter.get("/me", asyncHandler(getCurrentUser));
usersRouter.patch("/me", asyncHandler(updateUserPreferences));
usersRouter.delete("/me", asyncHandler(deleteCurrentUser));
