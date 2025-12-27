import cors from "cors";
import express from "express";

import { authRouter } from "./routes/auth.routes.js";
import { episodesRouter } from "./routes/episodes.routes.js";
import { gmailRouter } from "./routes/gmail.routes.js";
import { webhooksRouter } from "./routes/webhooks.routes.js";
import { AppError, toErrorMessage } from "./utils/errors.js";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "2mb" }));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/auth", authRouter);
  app.use("/gmail", gmailRouter);
  app.use("/episodes", episodesRouter);
  app.use("/webhooks", webhooksRouter);

  app.use((req, res) => {
    res.status(404).json({ error: `Route ${req.method} ${req.path} not found.` });
  });

  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (err instanceof AppError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: toErrorMessage(err) });
  });

  return app;
}
