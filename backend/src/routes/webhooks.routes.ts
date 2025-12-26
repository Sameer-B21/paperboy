import { Router } from "express";

export const webhooksRouter = Router();

webhooksRouter.post("/gmail", (_req, res) => {
  res.status(202).json({ status: "queued" });
});
