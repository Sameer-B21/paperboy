type GmailHeader = { name?: string | null; value?: string | null };
type GmailPart = {
  mimeType?: string | null;
  filename?: string | null;
  body?: { data?: string | null };
  parts?: GmailPart[] | null;
  headers?: GmailHeader[] | null;
};

type GmailMessage = {
  id?: string | null;
  snippet?: string | null;
  payload?: GmailPart | null;
};

export type ParsedMessage = {
  id: string;
  from: string;
  subject: string;
  date: string;
  body: string;
  headers: Record<string, string>;
};

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const buffer = Buffer.from(normalized, "base64");
  return buffer.toString("utf8");
}

function normalizeHeaders(headers: GmailHeader[] | null | undefined): Record<string, string> {
  const map: Record<string, string> = {};
  headers?.forEach((header) => {
    const name = header.name?.toLowerCase();
    if (name && header.value) {
      map[name] = header.value;
    }
  });
  return map;
}

function extractBody(part?: GmailPart | null): string {
  if (!part) {
    return "";
  }
  if (part.mimeType === "text/plain" && part.body?.data) {
    return decodeBase64Url(part.body.data);
  }
  if (part.mimeType === "text/html" && part.body?.data) {
    const raw = decodeBase64Url(part.body.data);
    return raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  }
  if (part.parts && part.parts.length > 0) {
    for (const subPart of part.parts) {
      const body = extractBody(subPart);
      if (body) {
        return body;
      }
    }
  }
  return "";
}

export function parseMessage(message: GmailMessage): ParsedMessage | null {
  if (!message.id || !message.payload) {
    return null;
  }
  const headers = normalizeHeaders(message.payload.headers);
  const from = headers["from"] ?? "Unknown sender";
  const subject = headers["subject"] ?? "Untitled newsletter";
  const date = headers["date"] ?? new Date().toISOString();
  const body = extractBody(message.payload) || message.snippet || "";

  return {
    id: message.id,
    from,
    subject,
    date,
    body,
    headers,
  };
}
