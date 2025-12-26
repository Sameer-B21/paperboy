import { audioBucket, supabase } from "../../config/supabase.js";

export async function uploadAudio(episodeId: string, payload: Buffer): Promise<string> {
  const path = `${episodeId}.txt`;
  const { error } = await supabase.storage.from(audioBucket).upload(path, payload, {
    upsert: true,
    contentType: "text/plain; charset=utf-8",
  });
  if (error) {
    throw new Error(`Failed to upload audio: ${error.message}`);
  }
  return path;
}

export async function downloadAudio(path: string): Promise<{ data: Buffer; contentType?: string }> {
  const { data, error } = await supabase.storage.from(audioBucket).download(path);
  if (error || !data) {
    throw new Error(error?.message ?? "Unable to download audio.");
  }
  const arrayBuffer = await data.arrayBuffer();
  return { data: Buffer.from(arrayBuffer), contentType: data.type || undefined };
}
