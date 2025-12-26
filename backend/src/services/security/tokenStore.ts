import { decryptString, encryptString } from "./encrypt.js";
import { getConnectionByUser, upsertConnection } from "../../db/queries/connections.sql.js";
import type { Connection } from "../../db/types.js";

export async function storeConnectionTokens(payload: {
  userId: string;
  provider: Connection["provider"];
  accessToken: string;
  refreshToken: string | null;
  scope: string | null;
  expiresAt: string | null;
  email: string | null;
}): Promise<Connection> {
  return upsertConnection({
    userId: payload.userId,
    provider: payload.provider,
    accessToken: encryptString(payload.accessToken),
    refreshToken: payload.refreshToken ? encryptString(payload.refreshToken) : null,
    scope: payload.scope,
    expiresAt: payload.expiresAt,
    email: payload.email,
  });
}

export async function loadConnectionTokens(
  userId: string,
  provider: Connection["provider"] = "gmail"
): Promise<Connection | null> {
  const connection = await getConnectionByUser(userId, provider);
  if (!connection) {
    return null;
  }
  return {
    ...connection,
    accessToken: decryptString(connection.accessToken),
    refreshToken: connection.refreshToken ? decryptString(connection.refreshToken) : null,
  };
}
