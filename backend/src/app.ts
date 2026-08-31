import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";

import { env } from "./config/env.js";
import { supabase } from "./config/supabase.js";
import { jobQueue } from "./jobs/queue.js";
import { runDailyDigestForDueUsers } from "./jobs/workers/dailyDigest.worker.js";
import { getEpisodeAudio } from "./controllers/episodes.controller.js";
import { requireUser, requireUserOrSignedAudioUrl } from "./middleware/requireUser.js";
import { purgeExpiredEpisodes } from "./services/security/retention.js";
import { authRouter } from "./routes/auth.routes.js";
import { episodesRouter } from "./routes/episodes.routes.js";
import { gmailRouter } from "./routes/gmail.routes.js";
import { ttsRouter } from "./routes/tts.routes.js";
import { usersRouter } from "./routes/users.routes.js";
import { webhooksRouter } from "./routes/webhooks.routes.js";
import { AppError, asyncHandler, toErrorMessage } from "./utils/errors.js";

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

  // Health check endpoint — verifies the database is reachable too
  app.get("/health", asyncHandler(async (_req, res) => {
    const { error } = await supabase.from("users").select("id").limit(1);
    if (error) {
      res.status(503).json({ status: "degraded", database: "unreachable" });
      return;
    }
    res.json({ status: "ok" });
  }));

  // Host-cron trigger for the daily digest. Delivery times are per-user now,
  // so a host cron must hit this URL HOURLY; each call generates digests only
  // for users whose chosen hour arrived. Requires CRON_SECRET to be matched.
  app.post("/internal/cron/daily", (req, res) => {
    if (!env.CRON_SECRET || req.header("x-cron-secret") !== env.CRON_SECRET) {
      res.status(401).json({ error: "Unauthorized." });
      return;
    }
    jobQueue.add(async () => {
      const now = new Date();
      await runDailyDigestForDueUsers(now);
      //same as the in-process scheduler: hosts running with ENABLE_SCHEDULER=false
      //would otherwise never expire old newsletter text
      await purgeExpiredEpisodes(now);
    });
    res.status(202).json({ status: "queued" });
  });

  // Routes
  app.use(
    "/auth",
    rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false }),
    authRouter
  );
  app.use("/gmail", requireUser, gmailRouter);
  //audio accepts a signed URL token as well as the session header, because
  //HTML5 <audio> on web can't send Authorization headers
  app.get("/episodes/:episodeId/audio", requireUserOrSignedAudioUrl, asyncHandler(getEpisodeAudio));
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
