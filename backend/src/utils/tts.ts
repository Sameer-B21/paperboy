const allowedVoices = new Set([
  "alloy",
  "ash",
  "coral",
  "echo",
  "fable",
  "onyx",
  "nova",
  "sage",
  "shimmer",
]);

export function normalizeTtsVoice(voice: unknown): string | undefined {
  if (typeof voice !== "string") {
    return undefined;
  }
  const normalized = voice.trim().toLowerCase();
  return allowedVoices.has(normalized) ? normalized : undefined;
}
