type GmailHeaders = Record<string, string>;

// Function to determine if an email is a newsletter based on its headers
export function isNewsletterEmail(headers: GmailHeaders): boolean {
  const from = (headers["from"] ?? "").toLowerCase();
  const subject = (headers["subject"] ?? "").toLowerCase();
  const listUnsubscribe = headers["list-unsubscribe"];

  //if has an unsubscribe header, likely a newsletter
  if (listUnsubscribe) {
    return true;
  }

  //check for common newsletter indicators in from and subject
  if (from.includes("newsletter") || from.includes("digest")) {
    return true;
  }

  //check subject for newsletter indicators
  if (subject.includes("newsletter") || subject.includes("digest")) {
    return true;
  }

  return false;
}
