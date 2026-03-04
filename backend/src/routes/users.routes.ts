import { Router } from "express";

import { updateUserPreferences } from "../controllers/users.controller.js";

export const usersRouter = Router();

usersRouter.patch("/me", updateUserPreferences);
