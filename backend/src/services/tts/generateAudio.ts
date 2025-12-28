import { env } from "../../config/env.js";
import { logger } from "../../utils/logger.js";

function estimateTokensFromChars(charCount: number): number {
  return Math.ceil(charCount / 4);
}

function formatTtsCost(model: string, charCount: number): string {
  const tokens = estimateTokensFromChars(charCount);
  const pricePer1MChars = env.OPENAI_TTS_PRICE_PER_1M_CHARS
    ? Number.parseFloat(env.OPENAI_TTS_PRICE_PER_1M_CHARS)
    : null;

  if (!pricePer1MChars || Number.isNaN(pricePer1MChars)) {
    return `chars ${charCount}; est tokens ${tokens}; cost unknown`;
  }

  const cost = (charCount / 1_000_000) * pricePer1MChars;
  return `chars ${charCount}; est tokens ${tokens}; est cost $${cost.toFixed(6)}`;
}

// Generate audio with OpenAI's TTS endpoint.
export async function generateAudio(script: string): Promise<Buffer> {
  if (!env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY.");
  }

  const model = env.OPENAI_TTS_MODEL ?? "gpt-4o-mini-tts";
  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      voice: env.OPENAI_TTS_VOICE ?? "alloy",
      input: script,
      response_format: "mp3",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI TTS request failed: ${response.status} ${errorText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  logger.info(`OpenAI TTS usage (${model}): ${formatTtsCost(model, script.length)}`);
  return Buffer.from(arrayBuffer);
}
