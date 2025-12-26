import { google } from "googleapis";

import { oauthClient } from "../../config/googleOAuth.js";
import type { Connection } from "../../db/types.js";

export function createGmailClient(connection: Connection) {
  const client = oauthClient;
  client.setCredentials({
    access_token: connection.accessToken,
    refresh_token: connection.refreshToken ?? undefined,
  });

  const gmail = google.gmail({ version: "v1", auth: client });

  return { gmail, client };
}
