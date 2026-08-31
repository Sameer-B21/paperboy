import { purgeExpiredEpisodes } from "../services/security/retention.js";
import { logger } from "../utils/logger.js";
import { runDailyDigestForDueUsers } from "./workers/dailyDigest.worker.js";

let lastRunHourKey: string | null = null;
//once per hour, generates digests for users whose chosen delivery hour arrived.
//fires on the first tick inside each hour (not exactly :00) so a restart just
//before the hour can't skip a day; the worker's "digest already exists" check
//keeps a same-hour restart from generating twice.
async function tick() {
  const now = new Date();
  const hourKey = now.toISOString().slice(0, 13);
  if (lastRunHourKey === hourKey) {
    return;
  }
  lastRunHourKey = hourKey;
  try {
    await runDailyDigestForDueUsers(now);
  } catch (error) {
    logger.error("Daily digest scheduler failed", { error });
  }
  //runs even if the digest above threw — retention is a privacy promise, not a
  //feature, so it must not depend on generation succeeding
  try {
    await purgeExpiredEpisodes(now);
  } catch (error) {
    logger.error("Retention sweep failed", { error });
  }
}

//starts the daily digest scheduler
export function startDailyDigestScheduler(): void {
  void tick();
  setInterval(() => {
    void tick();
  }, 60 * 1000);
}
