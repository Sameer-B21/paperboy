const allowedVoices = new Set([
  "rachel",
  "drew",
  "clyde",
  "paul",
  "domi",
  "fin",
  "sarah",
  "antoni",
  "thomas",
]);

export function normalizeTtsVoice(voice: unknown): string | undefined {
  if (typeof voice !== "string") {
    return undefined;
  }
  const normalized = voice.trim().toLowerCase();
  return allowedVoices.has(normalized) ? normalized : undefined;
}
