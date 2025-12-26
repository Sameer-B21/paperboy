import { updateEpisode } from "../../db/queries/episodes.sql.js";
import { uploadAudio } from "../../services/storage/uploadAudio.js";
import { generateAudio } from "../../services/tts/generateAudio.js";

export async function generateEpisodeAudio(payload: {
  episodeId: string;
  script: string;
}): Promise<string> {
  const audioBuffer = generateAudio(payload.script);
  const audioPath = await uploadAudio(payload.episodeId, audioBuffer);

  await updateEpisode(payload.episodeId, {
    audioPath,
    status: "completed",
  });

  return audioPath;
}
