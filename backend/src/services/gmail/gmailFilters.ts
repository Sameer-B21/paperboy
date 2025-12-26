type GmailHeaders = Record<string, string>;

export function isNewsletterEmail(headers: GmailHeaders): boolean {
  const from = (headers["from"] ?? "").toLowerCase();
  const subject = (headers["subject"] ?? "").toLowerCase();
  const listUnsubscribe = headers["list-unsubscribe"];

  if (listUnsubscribe) {
    return true;
  }

  if (from.includes("newsletter") || from.includes("digest")) {
    return true;
  }

  if (subject.includes("newsletter") || subject.includes("digest")) {
    return true;
  }

  return false;
}
