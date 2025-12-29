import { parseBuffer } from "music-metadata";

export async function getAudioDurationSeconds(audioBuffer: Buffer): Promise<number | null> {
  try {
    const metadata = await parseBuffer(audioBuffer, "audio/mpeg");
    const duration = metadata.format.duration;
    if (!duration || !Number.isFinite(duration)) {
      return null;
    }
    return Math.round(duration);
  } catch {
    return null;
  }
}
