import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { startDailyDigestScheduler } from "./jobs/dailyDigestScheduler.js";
import { logger } from "./utils/logger.js";

const app = createApp();

// Start the server
const server = app.listen(env.PORT, () => {
  logger.info(`Backend listening on http://localhost:${env.PORT}`);
  if (env.ENABLE_SCHEDULER) {
    startDailyDigestScheduler();
  } else {
    logger.info("In-process scheduler disabled (ENABLE_SCHEDULER=false); expecting host cron to hit /internal/cron/daily");
  }
});

//let in-flight requests finish when the host restarts/redeploys the process
function shutdown(signal: string) {
  logger.info(`Received ${signal}, shutting down.`);
  server.close(() => {
    process.exit(0);
  });
  //force-exit if connections refuse to drain
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
