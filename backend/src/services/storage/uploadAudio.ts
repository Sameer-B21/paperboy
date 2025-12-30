import { audioBucket, supabase } from "../../config/supabase.js";

// Upload audio file to Supabase Storage
export async function uploadAudioAtPath(path: string, payload: Buffer): Promise<string> {
  const { error } = await supabase.storage.from(audioBucket).upload(path, payload, {
    upsert: true,
    contentType: "audio/mpeg",
  });
  if (error) {
    throw new Error(`Failed to upload audio: ${error.message}`);
  }
  return path;
}

export async function uploadAudio(episodeId: string, payload: Buffer): Promise<string> {
  const path = `${episodeId}.mp3`;
  return uploadAudioAtPath(path, payload);
}

// Download audio file from Supabase Storage
export async function downloadAudioAtPath(
  path: string
): Promise<{ data: Buffer; contentType?: string }> {
  const { data, error } = await supabase.storage.from(audioBucket).download(path);
  if (error || !data) {
    throw new Error(error?.message ?? "Unable to download audio.");
  }
  const arrayBuffer = await data.arrayBuffer();
  return { data: Buffer.from(arrayBuffer), contentType: data.type || undefined };
}

export async function downloadAudio(
  path: string
): Promise<{ data: Buffer; contentType?: string }> {
  return downloadAudioAtPath(path);
}
