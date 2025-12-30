import type { Request, Response } from "express";
import { downloadAudioAtPath, uploadAudioAtPath } from "../services/storage/uploadAudio.js";
import { generateAudio } from "../services/tts/generateAudio.js";
import { normalizeTtsVoice } from "../utils/tts.js";

const PREVIEW_SCRIPT = "This is the Paperboy voice preview for your daily brief.";
const previewPathForVoice = (voice: string) => `tts-previews/${voice}.mp3`;

export async function previewTts(req: Request, res: Response) {
  const voice = normalizeTtsVoice(req.query.voice) ?? "alloy";
  const previewPath = previewPathForVoice(voice);
  let audioBuffer: Buffer;
  let contentType = "audio/mpeg";

  try {
    const cached = await downloadAudioAtPath(previewPath);
    audioBuffer = cached.data;
    contentType = cached.contentType ?? contentType;
  } catch {
    const generated = await generateAudio(PREVIEW_SCRIPT, voice);
    await uploadAudioAtPath(previewPath, generated);
    audioBuffer = generated;
  }

  res.setHeader("Content-Type", contentType);
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  res.send(audioBuffer);
}
