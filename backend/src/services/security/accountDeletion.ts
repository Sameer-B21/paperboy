import { createOAuthClient } from "../../config/googleOAuth.js";
import { deleteConnectionsByUser } from "../../db/queries/connections.sql.js";
import { deleteEpisodesByUser, listEpisodes } from "../../db/queries/episodes.sql.js";
import { deleteNewslettersByUser } from "../../db/queries/newsletters.sql.js";
import { deleteUserById } from "../../db/queries/users.sql.js";
import { logger } from "../../utils/logger.js";
import { removeAudioAtPaths } from "../storage/uploadAudio.js";
import { loadConnectionTokens } from "./tokenStore.js";

//tells Google to invalidate the app's access to the user's Gmail; best
//effort — an already-expired token must not block the rest of the wipe
export async function revokeGoogleAccess(userId: string): Promise<void> {
  const connection = await loadConnectionTokens(userId, "gmail");
  if (!connection) {
    return;
  }
  const token = connection.refreshToken ?? connection.accessToken;
  try {
    await createOAuthClient().revokeToken(token);
  } catch (error) {
    logger.warn(`Failed to revoke Google token for user ${userId}: ${error}`);
  }
}

//disconnects Gmail: revoke at Google, then drop the stored tokens
export async function disconnectGmail(userId: string): Promise<void> {
  await revokeGoogleAccess(userId);
  await deleteConnectionsByUser(userId);
}

//removes every trace of the user: Google access, audio files, and all rows
export async function deleteAccount(userId: string): Promise<void> {
  await revokeGoogleAccess(userId);

  //remove generated audio from storage before the episode rows go away
  const episodes = await listEpisodes(userId);
  const audioPaths = episodes
    .map((episode) => episode.audioPath)
    .filter((path): path is string => Boolean(path));
  try {
    await removeAudioAtPaths(audioPaths);
  } catch (error) {
    logger.warn(`Failed to remove audio files for user ${userId}: ${error}`);
  }

  await deleteEpisodesByUser(userId);
  await deleteNewslettersByUser(userId);
  await deleteConnectionsByUser(userId);
  await deleteUserById(userId);
}
