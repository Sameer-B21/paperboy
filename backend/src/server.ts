import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";
import { startDailyDigestScheduler } from "./jobs/dailyDigestScheduler.js";

const app = createApp();

app.listen(env.PORT, () => {
  logger.info(`Backend listening on http://localhost:${env.PORT}`);
  startDailyDigestScheduler();
});
