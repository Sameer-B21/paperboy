import { supabase } from "../../config/supabase.js";
import type { Episode } from "../types.js";

// Defines the shape of an episode row in the database
type EpisodeRow = {
  id: string;
  user_id: string;
  newsletter_id: string | null;
  title: string | null;
  subject: string;
  body: string | null;
  summary: string | null;
  script: string | null;
  audio_path: string | null;
  status: Episode["status"];
  source_message_id: string | null;
  created_at: string;
  updated_at: string;
};

// Converts a database row to an Episode object
function toEpisode(row: EpisodeRow): Episode {
  return {
    id: row.id,
    userId: row.user_id,
    newsletterId: row.newsletter_id,
    subject: row.subject ?? row.title ?? "Untitled",
    body: row.body,
    summary: row.summary,
    script: row.script,
    audioPath: row.audio_path,
    status: row.status,
    sourceMessageId: row.source_message_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Creates a new episode record in the database
export async function createEpisode(payload: {
  userId: string;
  newsletterId: string | null;
  subject: string;
  sourceMessageId: string | null;
  body?: string | null;
}): Promise<Episode> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("episodes")
    .insert({
      user_id: payload.userId,
      newsletter_id: payload.newsletterId,
      title: payload.subject,
      subject: payload.subject,
      body: payload.body ?? null,
      status: "queued",
      source_message_id: payload.sourceMessageId,
      created_at: now,
      updated_at: now,
    })
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(`Failed to create episode: ${error?.message ?? "Unknown error"}`);
  }
  return toEpisode(data as EpisodeRow);
}

// Updates an existing episode record in the database
export async function updateEpisode(
  episodeId: string,
  updates: Partial<Pick<Episode, "summary" | "script" | "audioPath" | "status">>
): Promise<Episode> {
  const updatePayload: {
    summary?: string | null;
    script?: string | null;
    audio_path?: string | null;
    status?: Episode["status"];
    updated_at: string;
  } = {
    updated_at: new Date().toISOString(),
  };
  if (updates.summary !== undefined) {
    updatePayload.summary = updates.summary;
  }
  if (updates.script !== undefined) {
    updatePayload.script = updates.script;
  }
  if (updates.audioPath !== undefined) {
    updatePayload.audio_path = updates.audioPath;
  }
  if (updates.status !== undefined) {
    updatePayload.status = updates.status;
  }

  const { data, error } = await supabase
    .from("episodes")
    .update(updatePayload)
    .eq("id", episodeId)
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(`Failed to update episode: ${error?.message ?? "Unknown error"}`);
  }
  return toEpisode(data as EpisodeRow);
}

// Lists all episodes for a specific user
export async function listEpisodes(userId: string): Promise<Episode[]> {
  const { data, error } = await supabase
    .from("episodes")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) {
    throw new Error(`Failed to list episodes: ${error.message}`);
  }
  return (data ?? []).map((row) => toEpisode(row as EpisodeRow));
}

// Retrieves a specific episode by its ID
export async function getEpisode(episodeId: string): Promise<Episode | null> {
  const { data, error } = await supabase.from("episodes").select("*").eq("id", episodeId).maybeSingle();
  if (error) {
    throw new Error(`Failed to load episode: ${error.message}`);
  }
  return data ? toEpisode(data as EpisodeRow) : null;
}

// Lists episodes created since a specific ISO date for a user
export async function listEpisodesSince(
  userId: string,
  sinceIso: string
): Promise<Episode[]> {
  const { data, error } = await supabase
    .from("episodes")
    .select("*")
    .eq("user_id", userId)
    .gte("created_at", sinceIso)
    .not("source_message_id", "ilike", "digest-%")
    .order("created_at", { ascending: true });
  if (error) {
    throw new Error(`Failed to list recent episodes: ${error.message}`);
  }
  return (data ?? []).map((row) => toEpisode(row as EpisodeRow));
}

// Lists episodes for a specific day for a user
export async function listEpisodesForDay(
  userId: string,
  startIso: string,
  endIso: string
): Promise<Episode[]> {
  const { data, error } = await supabase
    .from("episodes")
    .select("*")
    .eq("user_id", userId)
    .gte("created_at", startIso)
    .lt("created_at", endIso)
    .not("source_message_id", "ilike", "digest-%")
    .order("created_at", { ascending: true });
  if (error) {
    throw new Error(`Failed to list episodes for day: ${error.message}`);
  }
  return (data ?? []).map((row) => toEpisode(row as EpisodeRow));
}

// Retrieves an episode by its source message ID for a user
export async function getEpisodeBySourceMessageId(
  userId: string,
  sourceMessageId: string
): Promise<Episode | null> {
  const { data, error } = await supabase
    .from("episodes")
    .select("*")
    .eq("user_id", userId)
    .eq("source_message_id", sourceMessageId)
    .maybeSingle();
  if (error) {
    throw new Error(`Failed to load episode by message: ${error.message}`);
  }
  return data ? toEpisode(data as EpisodeRow) : null;
}

// Retrieves the latest daily digest episode for a user
export async function getLatestDailyDigest(userId: string): Promise<Episode | null> {
  const { data, error } = await supabase
    .from("episodes")
    .select("*")
    .eq("user_id", userId)
    .ilike("source_message_id", "digest-%")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    throw new Error(`Failed to load daily digest: ${error.message}`);
  }
  return data ? toEpisode(data as EpisodeRow) : null;
}
