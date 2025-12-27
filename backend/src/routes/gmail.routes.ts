import { Router } from "express";

import {
  listUserNewsletters,
  syncGmail,
  updateNewsletter,
} from "../controllers/gmail.controller.js";

export const gmailRouter = Router();

//gmail routes

gmailRouter.post("/sync", syncGmail);
gmailRouter.get("/newsletters", listUserNewsletters);
gmailRouter.patch("/newsletters/:newsletterId", updateNewsletter);
