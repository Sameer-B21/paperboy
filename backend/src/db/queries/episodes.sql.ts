import { supabase } from "../../config/supabase.js";
import type { Episode } from "../types.js";

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

export async function updateEpisode(
  episodeId: string,
  updates: Partial<Pick<Episode, "summary" | "script" | "audioPath" | "status">>
): Promise<Episode> {
  const { data, error } = await supabase
    .from("episodes")
    .update({
      summary: updates.summary,
      script: updates.script,
      audio_path: updates.audioPath,
      status: updates.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", episodeId)
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(`Failed to update episode: ${error?.message ?? "Unknown error"}`);
  }
  return toEpisode(data as EpisodeRow);
}

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

export async function getEpisode(episodeId: string): Promise<Episode | null> {
  const { data, error } = await supabase.from("episodes").select("*").eq("id", episodeId).maybeSingle();
  if (error) {
    throw new Error(`Failed to load episode: ${error.message}`);
  }
  return data ? toEpisode(data as EpisodeRow) : null;
}

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
