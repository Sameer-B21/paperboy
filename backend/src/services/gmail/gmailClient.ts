import { google } from "googleapis";

import { createOAuthClient } from "../../config/googleOAuth.js";
import type { Connection } from "../../db/types.js";
import { logger } from "../../utils/logger.js";
import { storeConnectionTokens } from "../security/tokenStore.js";

//function to create gmail client for a given connection
export function createGmailClient(connection: Connection) {
  //each connection gets its own client — sharing one mutates credentials
  //across concurrent requests and can read the wrong user's mailbox
  const client = createOAuthClient();
  const expiryDate = connection.expiresAt ? Date.parse(connection.expiresAt) : null;
  client.setCredentials({
    access_token: connection.accessToken,
    refresh_token: connection.refreshToken ?? undefined,
    expiry_date: expiryDate && !Number.isNaN(expiryDate) ? expiryDate : undefined,
  });

  //persist refreshed access tokens, otherwise every request after expiry
  //pays for another refresh round-trip
  client.on("tokens", (tokens) => {
    if (!tokens.access_token) {
      return;
    }
    void storeConnectionTokens({
      userId: connection.userId,
      provider: connection.provider,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? connection.refreshToken ?? null,
      scope: tokens.scope ?? connection.scope ?? null,
      expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
      email: connection.email,
    }).catch((error) => {
      logger.warn(`Failed to persist refreshed Gmail tokens for user ${connection.userId}: ${error}`);
    });
  });

  //construct gmail client
  const gmail = google.gmail({ version: "v1", auth: client });

  return { gmail, client };
}

//helper to identify OAuth invalid_grant errors
export function isInvalidGrantError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as any;
  return (
    err.response?.data?.error === "invalid_grant" ||
    err.error === "invalid_grant" ||
    err.code === "invalid_grant" ||
    (typeof err.message === "string" && err.message.includes("invalid_grant"))
  );
}
