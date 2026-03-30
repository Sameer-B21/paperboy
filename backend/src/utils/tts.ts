const allowedVoices = new Map([
  ["en-us-chirp3-hd-leda", "en-US-Chirp3-HD-Leda"],
  ["en-us-chirp3-hd-charon", "en-US-Chirp3-HD-Charon"],
  ["en-us-chirp3-hd-kore", "en-US-Chirp3-HD-Kore"],
  ["en-us-journey-f", "en-US-Journey-F"],
  ["en-us-journey-d", "en-US-Journey-D"],
  ["en-us-chirp-hd-f", "en-US-Chirp-HD-F"],
  ["en-us-chirp-hd-d", "en-US-Chirp-HD-D"],
  ["en-us-chirp-hd-o", "en-US-Chirp-HD-O"],
]);

export function normalizeTtsVoice(voice: unknown): string | undefined {
  if (typeof voice !== "string") {
    return undefined;
  }
  return allowedVoices.get(voice.trim().toLowerCase());
}
