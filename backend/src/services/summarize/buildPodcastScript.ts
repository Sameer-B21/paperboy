//generates podcast script
export function buildPodcastScript(payload: { subject: string; summary: string }): string {
  // const intro = `Welcome back. Today we're covering ${payload.subject}.`;
  const body = payload.summary;
  // const outro = "Thanks for listening. We'll be back with more updates soon.";
  return body;
}
