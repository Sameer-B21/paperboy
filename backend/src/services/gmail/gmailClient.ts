import { google } from "googleapis";

import { oauthClient } from "../../config/googleOAuth.js";
import type { Connection } from "../../db/types.js";

//function to create gmail client for a given connection
export function createGmailClient(connection: Connection) {
  const client = oauthClient;
  client.setCredentials({
    access_token: connection.accessToken,
    refresh_token: connection.refreshToken ?? undefined,
  });

  //construct gmail client
  const gmail = google.gmail({ version: "v1", auth: client });

  return { gmail, client };
}
