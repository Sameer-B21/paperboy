import { env } from "../../config/env.js";
import { logger } from "../../utils/logger.js";

// Generate audio with Google Cloud TTS REST API.
export async function generateAudio(script: string, voice?: string): Promise<Buffer> {
  if (!env.GOOGLE_TTS_API_KEY) {
    throw new Error("Missing GOOGLE_TTS_API_KEY.");
  }

  const voiceName = voice?.trim() || "en-US-Chirp3-HD-Leda";
  const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${env.GOOGLE_TTS_API_KEY}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: { text: script },
      voice: { languageCode: "en-US", name: voiceName },
      audioConfig: { audioEncoding: "MP3" },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google TTS request failed: ${response.status} ${errorText}`);
  }

  const data = await response.json() as { audioContent?: string };
  if (!data.audioContent) {
    throw new Error("Google TTS response missing audioContent.");
  }

  logger.info(`Google Cloud TTS usage (${voiceName}): characters ${script.length}`);
  
  // Google returns audio as a base64 encoded string
  return Buffer.from(data.audioContent, "base64");
}
