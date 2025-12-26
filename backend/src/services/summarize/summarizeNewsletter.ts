export function summarizeNewsletter(body: string): string {
  const sanitized = body.replace(/\s+/g, " ").trim();
  const sentences = sanitized.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (sentences.length === 0) {
    return sanitized.slice(0, 500);
  }
  return sentences.slice(0, 3).join(" ");
}
