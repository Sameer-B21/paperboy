import { logger } from "../utils/logger.js";
import { runDailyDigestForAllUsers } from "./workers/dailyDigest.worker.js";

let lastRunKey: string | null = null;
//checks every minute if it's 7 AM to run daily digest for all users
async function tick() {
  const now = new Date();
  if (now.getHours() !== 7 || now.getMinutes() !== 0) {
    return;
  }
  const dayKey = now.toISOString().slice(0, 10);
  if (lastRunKey === dayKey) {
    return;
  }
  lastRunKey = dayKey;
  try {
    await runDailyDigestForAllUsers(now);
  } catch (error) {
    logger.error("Daily digest scheduler failed", { error });
  }
}

//starts the daily digest scheduler
export function startDailyDigestScheduler(): void {
  void tick();
  setInterval(() => {
    void tick();
  }, 60 * 1000);
}
