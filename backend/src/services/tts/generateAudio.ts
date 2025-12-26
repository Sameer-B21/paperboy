export function generateAudio(script: string): Buffer {
  const payload = [
    "Podcast audio placeholder",
    "",
    script,
    "",
    "(Replace with real TTS output.)",
  ].join("\n");
  return Buffer.from(payload, "utf-8");
}
