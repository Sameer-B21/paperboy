import { createGmailClient } from "./gmailClient.js";
import { isNewsletterEmail } from "./gmailFilters.js";
import { parseMessage } from "./gmailParser.js";
import { loadConnectionTokens } from "../security/tokenStore.js";
import { listNewsletters, upsertNewsletter } from "../../db/queries/newsletters.sql.js";
import { createEpisode, getEpisodeBySourceMessageId } from "../../db/queries/episodes.sql.js";

function parseSender(fromHeader: string): { name: string; email: string } {
  const match = fromHeader.match(/^(.*)<([^>]+)>$/);
  if (match) {
    return { name: match[1].trim().replace(/^\"|\"$/g, ""), email: match[2].trim() };
  }
  return { name: fromHeader.trim(), email: fromHeader.trim() };
}

export type IngestedEpisodeSeed = {
  episodeId: string;
  subject: string;
  body: string;
};

export async function discoverNewslettersForUser(userId: string): Promise<number> {
  const connection = await loadConnectionTokens(userId, "gmail");
  if (!connection) {
    throw new Error("No Gmail connection found.");
  }

  const { gmail } = createGmailClient(connection);
  const response = await gmail.users.messages.list({
    userId: "me",
    q: "newer_than:30d",
    maxResults: 25,
  });

  const messageIds = response.data.messages ?? [];
  if (messageIds.length === 0) {
    return 0;
  }

  const existingNewsletters = await listNewsletters(userId);
  const newsletterIndex = new Map(
    existingNewsletters.map((newsletter) => [newsletter.sender.toLowerCase(), newsletter])
  );

  let discoveredCount = 0;

  for (const message of messageIds) {
    if (!message.id) {
      continue;
    }
    const detailResponse = await gmail.users.messages.get({
      userId: "me",
      id: message.id,
      format: "full",
    });
    const parsed = parseMessage(detailResponse.data as never);
    if (!parsed || !isNewsletterEmail(parsed.headers)) {
      continue;
    }
    const sender = parseSender(parsed.from);
    const existingNewsletter = newsletterIndex.get(sender.email.toLowerCase());
    if (!existingNewsletter) {
      const newsletter = await upsertNewsletter({
        userId,
        name: sender.name || sender.email,
        sender: sender.email,
        selected: false,
      });
      newsletterIndex.set(sender.email.toLowerCase(), newsletter);
      discoveredCount += 1;
    }
  }

  return discoveredCount;
}

export async function ingestNewsletterForUser(
  userId: string,
  senderEmail: string
): Promise<IngestedEpisodeSeed[]> {
  const connection = await loadConnectionTokens(userId, "gmail");
  if (!connection) {
    throw new Error("No Gmail connection found.");
  }

  const { gmail } = createGmailClient(connection);
  const response = await gmail.users.messages.list({
    userId: "me",
    q: `from:${senderEmail} newer_than:1d`,
    maxResults: 25,
  });

  const messageIds = response.data.messages ?? [];
  if (messageIds.length === 0) {
    return [];
  }

  const newsletters = await listNewsletters(userId);
  const newsletter = newsletters.find(
    (item) => item.sender.toLowerCase() === senderEmail.toLowerCase()
  );
  if (!newsletter) {
    return [];
  }

  const createdEpisodes: IngestedEpisodeSeed[] = [];

  for (const message of messageIds) {
    if (!message.id) {
      continue;
    }
    const detailResponse = await gmail.users.messages.get({
      userId: "me",
      id: message.id,
      format: "full",
    });
    const parsed = parseMessage(detailResponse.data as never);
    if (!parsed || !isNewsletterEmail(parsed.headers)) {
      continue;
    }
    const existingEpisode = await getEpisodeBySourceMessageId(userId, parsed.id);
    if (existingEpisode) {
      continue;
    }
    const episode = await createEpisode({
      userId,
      newsletterId: newsletter.id,
      subject: parsed.subject,
      sourceMessageId: parsed.id,
      body: parsed.body,
    });
    createdEpisodes.push({
      episodeId: episode.id,
      subject: parsed.subject,
      body: parsed.body,
    });
  }

  return createdEpisodes;
}
