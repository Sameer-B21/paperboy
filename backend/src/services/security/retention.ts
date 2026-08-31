import { env } from "../../config/env.js";
import {
  deleteEpisodesByIds,
  listEpisodesOlderThan,
} from "../../db/queries/episodes.sql.js";
import { logger } from "../../utils/logger.js";
import { removeAudioAtPaths } from "../storage/uploadAudio.js";

//how many episodes one sweep will clear; a sweep runs hourly, so a large
//backlog drains over a few hours instead of stalling the scheduler tick
const SWEEP_BATCH_SIZE = 500;
//Supabase rejects very large `in` lists and `remove` arrays, so work in chunks
const CHUNK_SIZE = 100;

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

/**
 * Deletes episodes older than the retention window, along with their audio.
 *
 * Episode rows hold the full text of a user's newsletters, so keeping them
 * forever is both a privacy liability and something we'd have to disclose as
 * indefinite retention during Google's restricted-scope review. The window is
 * the promise made in the privacy policy — change one and change the other.
 */
export async function purgeExpiredEpisodes(now = new Date()): Promise<number> {
  const cutoff = new Date(now.getTime() - env.EPISODE_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const expired = await listEpisodesOlderThan(cutoff.toISOString(), SWEEP_BATCH_SIZE);
  if (expired.length === 0) {
    return 0;
  }

  //audio goes first: an orphaned row is recoverable, an orphaned file in a
  //private bucket is invisible and never gets cleaned up
  const audioPaths = expired
    .map((episode) => episode.audioPath)
    .filter((path): path is string => Boolean(path));
  for (const paths of chunk(audioPaths, CHUNK_SIZE)) {
    try {
      await removeAudioAtPaths(paths);
    } catch (error) {
      //a missing file must not block the rows from being deleted
      logger.warn(`Retention sweep failed to remove audio: ${error}`);
    }
  }

  for (const ids of chunk(expired.map((episode) => episode.id), CHUNK_SIZE)) {
    await deleteEpisodesByIds(ids);
  }

  logger.info(
    `Retention sweep deleted ${expired.length} episode(s) older than ${env.EPISODE_RETENTION_DAYS} days.`
  );
  return expired.length;
}
