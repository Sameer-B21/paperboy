import { env } from "../../config/env.js";

export type DigestItem = {
  subject: string;
  body: string;
};

type Usage = {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
};

type ModelPricing = {
  inputPer1MTokens: number;
  outputPer1MTokens: number;
};

const MODEL_PRICING: Record<string, ModelPricing> = {
  "gpt-4o-mini": { inputPer1MTokens: 0.15, outputPer1MTokens: 0.6 },
  "gpt-4o": { inputPer1MTokens: 5, outputPer1MTokens: 15 },
};

function formatUsageCost(model: string, usage?: Usage): string {
  if (!usage) {
    return "tokens unknown; cost unknown";
  }
  const promptTokens = usage.prompt_tokens ?? 0;
  const completionTokens = usage.completion_tokens ?? 0;
  const totalTokens = usage.total_tokens ?? promptTokens + completionTokens;
  const pricing = MODEL_PRICING[model];
  if (!pricing) {
    return `tokens ${promptTokens}/${completionTokens}/${totalTokens}; cost unknown for model ${model}`;
  }
  const cost =
    (promptTokens / 1_000_000) * pricing.inputPer1MTokens +
    (completionTokens / 1_000_000) * pricing.outputPer1MTokens;
  return `tokens ${promptTokens}/${completionTokens}/${totalTokens}; estimated cost $${cost.toFixed(6)}`;
}

// Truncate input text to a maximum number of characters, adding a notice if truncated.
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
    // Try parsing the entire content as JSON first
    const parsed = JSON.parse(content) as { summary?: string; script?: string };
    if (parsed.summary && parsed.script) {
      return { summary: parsed.summary, script: parsed.script };
    }
  } catch {
    // fall through to regex extraction
    //----------------------------------------
  }

  // Use regex to find JSON object within the content
  const match = content.match(/\{[\s\S]*\}/);
  if (!match) {
    return null;
  }
  try {
    // Try parsing the matched JSON string
    const parsed = JSON.parse(match[0]) as { summary?: string; script?: string };
    if (parsed.summary && parsed.script) {
      return { summary: parsed.summary, script: parsed.script };
    }
  } catch {
    return null;
  }
  return null;
}

// Build a daily digest podcast script using OpenAI's Chat Completion API.
export async function buildDailyDigestScript(payload: {
  dateLabel: string;
  items: DigestItem[];
}): Promise<{ summary: string; script: string }> {
  if (!env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY.");
  }

  // Combine all newsletter items into a single input string.
  const combined = payload.items
    .map((item, index) => {
      const cleanedBody = cleanNewsletterText(item.body);
      return `Newsletter ${index + 1}: ${item.subject}\n${cleanedBody}`;
    })
    .join("\n\n");

  //truncate message
  const input = combined
  // truncateInput(combined, 12000);
  // console.log(`Input length to OpenAI: ${input.length} characters`);
  // console.log(combined);

  // Call OpenAI Chat Completion API
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

            `Turn the newsletters below into a smart, casual, Morning Brew–style audio briefing that replaces reading them.`+

            `Requirements:
            Cover all important content; ignore ads/promotions
            If topics overlap, address once
            Use a single-host, conversational voice, optimized for audio`+

            `Structure:
            1–2 sentence opening overview
            Segments introduced with: \“Moving on to {Newsletter Name}…\”
            End with “One Thing to Remember Today” and a short reflection`+

            `Length: ${PODCAST_LENGTH} minutes` +
            "Return JSON with keys \"summary\" (2-4 sentences) and \"script\" (4-6 minute read). " +
            `Newsletters:`, 
            input,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${errorText}`);
  }

  // Parse OpenAI response
  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: Usage;
    model?: string;
  };
  const model = data.model ?? (env.OPENAI_MODEL ?? "gpt-4o-mini");
  console.log(`OpenAI usage (${model}): ${formatUsageCost(model, data.usage)}`);

  // Extract content from the response
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("OpenAI response missing content.");
  }

  // Try to extract JSON from the content
  const parsed = extractJson(content);
  if (parsed) {
    return parsed;
  }

  return {
    summary: content.slice(0, 300),
    script: content,
  };
}
