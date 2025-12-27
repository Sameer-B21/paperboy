import { supabase } from "../../config/supabase.js";
import type { Connection } from "../types.js";

// Defines the shape of a connection row in the database
type ConnectionRow = {
  id: string;
  user_id: string;
  provider: "gmail";
  access_token: string;
  refresh_token: string | null;
  scope: string | null;
  expires_at: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
};

// Converts a database row to a Connection object
function toConnection(row: ConnectionRow): Connection {
  return {
    id: row.id,
    userId: row.user_id,
    provider: row.provider,
    accessToken: row.access_token,
    refreshToken: row.refresh_token,
    scope: row.scope,
    expiresAt: row.expires_at,
    email: row.email,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Retrieves a connection for a specific user and provider
export async function getConnectionByUser(
  userId: string,
  provider: Connection["provider"] = "gmail"
): Promise<Connection | null> {
  const { data, error } = await supabase
    .from("connections")
    .select("*")
    .eq("user_id", userId)
    .eq("provider", provider)
    .maybeSingle();
  if (error) {
    throw new Error(`Failed to load connection: ${error.message}`);
  }
  return data ? toConnection(data as ConnectionRow) : null;
}

// Upserts (inserts or updates) a connection record in the database
export async function upsertConnection(payload: {
  userId: string;
  provider: Connection["provider"];
  accessToken: string;
  refreshToken: string | null;
  scope: string | null;
  expiresAt: string | null;
  email: string | null;
}): Promise<Connection> {
  const { data, error } = await supabase
    .from("connections")
    .upsert(
      {
        user_id: payload.userId,
        provider: payload.provider,
        access_token: payload.accessToken,
        refresh_token: payload.refreshToken,
        scope: payload.scope,
        expires_at: payload.expiresAt,
        email: payload.email,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,provider" }
    )
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(`Failed to upsert connection: ${error?.message ?? "Unknown error"}`);
  }
  return toConnection(data as ConnectionRow);
}
