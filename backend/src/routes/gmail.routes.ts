import { Router } from "express";

import {
  listUserNewsletters,
  syncGmail,
  updateNewsletter,
} from "../controllers/gmail.controller.js";
import { asyncHandler } from "../utils/errors.js";

export const gmailRouter = Router();

//gmail routes

gmailRouter.post("/sync", asyncHandler(syncGmail));
gmailRouter.get("/newsletters", asyncHandler(listUserNewsletters));
gmailRouter.patch("/newsletters/:newsletterId", asyncHandler(updateNewsletter));
