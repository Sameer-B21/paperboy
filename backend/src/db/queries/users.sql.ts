import { supabase } from "../../config/supabase.js";
import type { User } from "../types.js";

// Defines the shape of a user row in the database
type UserRow = {
  id: string;
  email: string;
  name: string | null;
  podcast_duration_minutes: number | null;
  digest_utc_hour: number | null;
  created_at: string;
};

// Converts a database row to a User object
function toUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    podcastDurationMinutes: row.podcast_duration_minutes,
    digestUtcHour: row.digest_utc_hour,
    createdAt: row.created_at,
  };
}

// Retrieves a user by their ID
export async function getUserById(userId: string): Promise<User | null> {
  const { data, error } = await supabase.from("users").select("*").eq("id", userId).maybeSingle();
  if (error) {
    throw new Error(`Failed to load user: ${error.message}`);
  }
  return data ? toUser(data as UserRow) : null;
}

// Retrieves a user by their email
export async function getUserByEmail(email: string): Promise<User | null> {
  const { data, error } = await supabase.from("users").select("*").eq("email", email).maybeSingle();
  if (error) {
    throw new Error(`Failed to load user: ${error.message}`);
  }
  return data ? toUser(data as UserRow) : null;
}

// Creates a user row
export async function createUser(email: string, name: string | null): Promise<User> {
  const { data: inserted, error: insertError } = await supabase
    .from("users")
    .insert({ email, name })
    .select("*")
    .single();
  if (insertError || !inserted) {
    throw new Error(`Failed to create user: ${insertError?.message ?? "Unknown error"}`);
  }
  return toUser(inserted as UserRow);
}

// Retrieves a user by their email, or creates one if not found
export async function getOrCreateUserByEmail(
  email: string,
  name: string | null
): Promise<User> {
  const existing = await getUserByEmail(email);
  if (existing) {
    return existing;
  }
  return createUser(email, name);
}

// Updates user preferences
export async function updateUser(
  userId: string,
  updates: { podcastDurationMinutes?: number; digestUtcHour?: number }
): Promise<User> {
  const payload: Record<string, unknown> = {};
  if (updates.podcastDurationMinutes !== undefined) {
    payload.podcast_duration_minutes = updates.podcastDurationMinutes;
  }
  if (updates.digestUtcHour !== undefined) {
    payload.digest_utc_hour = updates.digestUtcHour;
  }
  const { data, error } = await supabase
    .from("users")
    .update(payload)
    .eq("id", userId)
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(`Failed to update user: ${error?.message ?? "Unknown error"}`);
  }
  return toUser(data as UserRow);
}

// Lists all users in the database
export async function listUsers(): Promise<User[]> {
  const { data, error } = await supabase.from("users").select("*").order("created_at");
  if (error) {
    throw new Error(`Failed to list users: ${error.message}`);
  }
  return (data ?? []).map((row) => toUser(row as UserRow));
}

// Deletes a user row
export async function deleteUserById(userId: string): Promise<void> {
  const { error } = await supabase.from("users").delete().eq("id", userId);
  if (error) {
    throw new Error(`Failed to delete user: ${error.message}`);
  }
}
