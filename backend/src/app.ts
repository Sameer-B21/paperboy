import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";

import { env } from "./config/env.js";
import { requireUser } from "./middleware/requireUser.js";
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

  // Behind a TLS-terminating proxy in production; needed for correct client
  // IPs in rate limiting.
  app.set("trust proxy", 1);

  // Middleware
  app.use(helmet());
  // The native app doesn't send an Origin header, so CORS only matters for
  // browsers — allow only the configured web frontend, if any.
  app.use(cors({ origin: env.FRONTEND_URL ? [env.FRONTEND_URL] : [] }));
  app.use(express.json({ limit: "2mb" }));

  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 300,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  // Health check endpoint
  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Routes
  app.use(
    "/auth",
    rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false }),
    authRouter
  );
  app.use("/gmail", requireUser, gmailRouter);
  app.use("/episodes", requireUser, episodesRouter);
  app.use("/webhooks", webhooksRouter);
  app.use("/tts", requireUser, ttsRouter);
  app.use("/users", requireUser, usersRouter);

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
