import { GoogleGenAI } from "@google/genai";
import { env } from "../../config/env.js";

export type DigestItem = {
  subject: string;
  body: string;
};

// Truncate input text to a maximum number of characters
function truncateInput(text: string, maxChars: number): string {
  if (text.length <= maxChars) {
    return text;
  }
  return `${text.slice(0, maxChars)}\n\n[Truncated for length]`;
}

function cleanNewsletterText(text: string): string {
  const dropLinePatterns = [
    /^\s*(unsubscribe|manage preferences|update your preferences)\b/i,
    /^\s*(view (?:this email|in browser)|view in browser)\b/i,
    /^\s*(privacy policy|terms of service)\b/i,
    /^\s*(forward to a friend|share|tweet|follow us)\b/i,
    /^\s*copyright\b/i,
  ];

  const cleaned = text
    .replace(/\r\n/g, "\n")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, "$1")
    .replace(/\bhttps?:\/\/\S+/gi, "")
    .replace(/\bwww\.\S+/gi, "")
    .replace(/\b[\w.+-]+@[\w-]+\.[\w.-]+\b/g, "");

  return cleaned
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => !dropLinePatterns.some((pattern) => pattern.test(line)))
    .join("\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Extract JSON object with "summary" and "script" from content string.
function extractJson(content: string): { summary: string; script: string } | null {
  try {
    const parsed = JSON.parse(content) as { summary?: string; script?: string };
    if (parsed.summary && parsed.script) {
      return { summary: parsed.summary, script: parsed.script };
    }
  } catch {
    // fall through to regex extraction
  }

  const match = content.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]) as { summary?: string; script?: string };
    if (parsed.summary && parsed.script) {
      return { summary: parsed.summary, script: parsed.script };
    }
  } catch {
    return null;
  }
  return null;
}

// Build a daily digest podcast script using Google's Gemini SDK.
export async function buildDailyDigestScript(payload: {
  dateLabel: string;
  items: DigestItem[];
  durationMinutes?: number;
}): Promise<{ summary: string; script: string }> {
  if (!env.GEMINI_API_KEY) {
    throw new Error("Missing GEMINI_API_KEY.");
  }

  const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

  // Combine all newsletter items into a single input string.
  const combined = payload.items
    .map((item, index) => {
      const cleanedBody = cleanNewsletterText(item.body);
      return `Newsletter ${index + 1}: ${item.subject}\n${cleanedBody}`;
    })
    .join("\n\n");

  const input = combined;

  const durationMin = payload.durationMinutes ?? 8;
  const systemInstruction = 
    `You are a podcast producer. Summarize multiple newsletters into a concise daily briefing.\n` +
    `Format your response strictly as JSON with exactly two fields:\n` +
    `1. "summary" (2-4 sentences overview)\n` +
    `2. "script" (a smart, casual ${durationMin}-minute read, ready for text-to-speech audio).`;

  const prompt = 
    `Create a daily podcast script for ${payload.dateLabel}.\n` +
    `Turn the newsletters below into a smart, casual, Morning Brew–style audio briefing that replaces reading them.\n\n` +
    `Requirements:\n` +
    `- Cover all important content; ignore ads/promotions\n` +
    `- If topics overlap, address once\n` +
    `- Use a single-host, conversational voice, optimized for audio\n\n` +
    `Structure:\n` +
    `- 1–2 sentence opening overview\n` +
    `- Segments introduced with: \"Moving on to {Newsletter Name}…\"\n` +
    `- End with “One Thing to Remember Today” and a short reflection\n\n` +
    `Newsletters:\n${input}\n\nRemember: Reply EXCLUSIVELY with the JSON structure.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      systemInstruction: systemInstruction,
      responseMimeType: 'application/json',
      temperature: 0.4,
    }
  });

  const content = response.text?.trim();
  if (!content) {
    throw new Error("Gemini response missing content.");
  }

  const parsed = extractJson(content);
  if (parsed) {
    return parsed;
  }

  return {
    summary: content.slice(0, 300),
    script: content,
  };
}
