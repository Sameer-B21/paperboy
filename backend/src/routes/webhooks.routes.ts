import { Router } from "express";

export const webhooksRouter = Router();

//webhook route for gmail push notifications

webhooksRouter.post("/gmail", (_req, res) => {
  res.status(202).json({ status: "queued" });
});
