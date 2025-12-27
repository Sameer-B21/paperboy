import { env } from "../../config/env.js";

export type DigestItem = {
  subject: string;
  body: string;
};

function truncateInput(text: string, maxChars: number): string {
  if (text.length <= maxChars) {
    return text;
  }
  return `${text.slice(0, maxChars)}\n\n[Truncated for length]`;
}

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
  if (!match) {
    return null;
  }
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

export async function buildDailyDigestScript(payload: {
  dateLabel: string;
  items: DigestItem[];
}): Promise<{ summary: string; script: string }> {
  if (!env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY.");
  }

  const combined = payload.items
    .map((item, index) => `Newsletter ${index + 1}: ${item.subject}\n${item.body}`)
    .join("\n\n");

  const input = truncateInput(combined, 12000);
  console.log(`Input length to OpenAI: ${input.length} characters`);

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL ?? "gpt-4o-mini",
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a podcast producer. Summarize multiple newsletters into a concise daily briefing.",
        },
        {
          role: "user",
          content:
            `Create a daily podcast script for ${payload.dateLabel}. ` +
            "Each newsletter below is a single concatenated daily blurb. " +
            "Return JSON with keys \"summary\" (2-4 sentences) and \"script\" (4-6 minute read). " +
            "Use an upbeat, informative tone. Avoid bullet points in the script.\n\n" +
            input,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("OpenAI response missing content.");
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
