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
    try {
      const generated = await generateAudio(PREVIEW_SCRIPT, voice);
      await uploadAudioAtPath(previewPath, generated);
      audioBuffer = generated;
    } catch (error) {
      console.error(`Failed to generate TTS preview for ${voice}:`, error);
      res.status(500).json({ error: "Failed to generate TTS preview." });
      return;
    }
  }

  res.setHeader("Content-Type", contentType);
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  res.send(audioBuffer);
}
