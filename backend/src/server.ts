import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { startDailyDigestScheduler } from "./jobs/dailyDigestScheduler.js";
import { logger } from "./utils/logger.js";

const app = createApp();

// Start the server
app.listen(env.PORT, () => {
  logger.info(`Backend listening on http://localhost:${env.PORT}`);
  startDailyDigestScheduler();
});
