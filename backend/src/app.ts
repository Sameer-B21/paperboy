import cors from "cors";
import express from "express";

import { authRouter } from "./routes/auth.routes.js";
import { episodesRouter } from "./routes/episodes.routes.js";
import { gmailRouter } from "./routes/gmail.routes.js";
import { ttsRouter } from "./routes/tts.routes.js";
import { usersRouter } from "./routes/users.routes.js";
import { webhooksRouter } from "./routes/webhooks.routes.js";
import { AppError, toErrorMessage } from "./utils/errors.js";

// Create and configure the Express application.
export function createApp() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: "2mb" }));

  // Health check endpoint
  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Routes
  app.use("/auth", authRouter);
  app.use("/gmail", gmailRouter);
  app.use("/episodes", episodesRouter);
  app.use("/webhooks", webhooksRouter);
  app.use("/tts", ttsRouter);
  app.use("/users", usersRouter);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ error: `Route ${req.method} ${req.path} not found.` });
  });

  // Error handler
  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (err instanceof AppError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: toErrorMessage(err) });
  });

  return app;
}
