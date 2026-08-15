import { google } from "googleapis";

import { oauthClient } from "../../config/googleOAuth.js";
import type { Connection } from "../../db/types.js";

//function to create gmail client for a given connection
export function createGmailClient(connection: Connection) {
  const client = oauthClient;
  const expiryDate = connection.expiresAt ? Date.parse(connection.expiresAt) : null;
  client.setCredentials({
    access_token: connection.accessToken,
    refresh_token: connection.refreshToken ?? undefined,
    expiry_date: expiryDate && !Number.isNaN(expiryDate) ? expiryDate : undefined,
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

