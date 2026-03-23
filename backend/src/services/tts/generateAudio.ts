import { env } from "../../config/env.js";
import { logger } from "../../utils/logger.js";

const voiceMap: Record<string, string> = {
  rachel: "21m00Tcm4TlvDq8ikWAM",
  drew: "29vD33N1CtxCmqQRPOHJ",
  clyde: "2EiwWnXFnvU5JabPnv8n",
  paul: "5Q0t7uMcjvnagumLfvZi",
  domi: "AZnzlk1XvdvUeBnXmlld",
  fin: "D38z5RcWu1voky8WS1ja",
  sarah: "EXAVITQu4vr4xnSDxMaL",
  antoni: "ErXwobaYiN019PkySvjV",
  thomas: "GBv7mTt0atIp3Br8iCZE",
};

export async function generateAudio(script: string, voiceName?: string): Promise<Buffer> {
  if (!env.ELEVENLABS_API_KEY) {
    throw new Error("Missing ELEVENLABS_API_KEY.");
  }

  const selectedVoice = voiceName?.trim().toLowerCase() || "rachel";
  const voiceId = voiceMap[selectedVoice] ?? voiceMap.rachel;

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": env.ELEVENLABS_API_KEY,
      "Content-Type": "application/json",
      "Accept": "audio/mpeg",
    },
    body: JSON.stringify({
      text: script,
      model_id: "eleven_monolingual_v1",
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ElevenLabs TTS request failed: ${response.status} ${errorText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  logger.info(`ElevenLabs TTS generated successfully for voice ${selectedVoice}`);
  return Buffer.from(arrayBuffer);
}
