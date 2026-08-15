import { createEpisode, getEpisodeBySourceMessageId } from "../../db/queries/episodes.sql.js";
import { listNewsletters, upsertNewsletter } from "../../db/queries/newsletters.sql.js";
import { AppError } from "../../utils/errors.js";
import { loadConnectionTokens } from "../security/tokenStore.js";
import { createGmailClient, isInvalidGrantError } from "./gmailClient.js";
import { isNewsletterEmail } from "./gmailFilters.js";
import { parseMessage } from "./gmailParser.js";

const MAX_NEWSLETTERS_PER_USER = 50;

// Parse the sender's name and email from the From header
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

// Discover newsletters for a user by scanning recent emails
export async function discoverNewslettersForUser(userId: string): Promise<number> {
  //check connection
  const connection = await loadConnectionTokens(userId, "gmail");
  if (!connection) {
    throw new AppError("No Gmail connection found.", 404);
  }

  //list recent messages
  const { gmail } = createGmailClient(connection);
  let messageIds: Array<{ id?: string | null }> = [];
  try {
    const response = await gmail.users.messages.list({
      userId: "me",
      q: "newer_than:30d",
      maxResults: 50,
    });
    messageIds = response.data.messages ?? [];
  } catch (error) {
    if (isInvalidGrantError(error)) {
      throw new AppError("Google access has expired. Please sign in again.", 401);
    }
    throw error;
  }

  if (messageIds.length === 0) {
    return 0;
  }

  //load existing newsletters
  const existingNewsletters = await listNewsletters(userId);
  const remainingSlots = Math.max(0, MAX_NEWSLETTERS_PER_USER - existingNewsletters.length);
  if (remainingSlots === 0) {
    return 0;
  }
  const newsletterIndex = new Map(
    existingNewsletters.map((newsletter) => [newsletter.sender.toLowerCase(), newsletter])
  );

  let discoveredCount = 0;

  //iterate messages to find newsletters
  for (const message of messageIds) {
    if (!message.id) {
      continue;
    }
    try {
      //get message details
      const detailResponse = await gmail.users.messages.get({
        userId: "me",
        id: message.id,
        format: "full",
      });
      //parse message
      const parsed = parseMessage(detailResponse.data as never);
      if (!parsed || !isNewsletterEmail(parsed.headers)) {
        continue;
      }
      //check if newsletter already exists
      const sender = parseSender(parsed.from);
      const existingNewsletter = newsletterIndex.get(sender.email.toLowerCase());
      if (!existingNewsletter) {
        if (discoveredCount >= remainingSlots) {
          break;
        }
        const newsletter = await upsertNewsletter({
          userId,
          name: sender.name || sender.email,
          sender: sender.email,
          selected: false,
        });
        newsletterIndex.set(sender.email.toLowerCase(), newsletter);
        discoveredCount += 1;
      }
    } catch (error) {
      if (isInvalidGrantError(error)) {
        throw new AppError("Google access has expired. Please sign in again.", 401);
      }
      throw error;
    }
  }

  return discoveredCount;
}

// Ingest newsletter emails for a specific sender into episodes
export async function ingestNewsletterForUser(
  userId: string,
  senderEmail: string
): Promise<IngestedEpisodeSeed[]> {
  //check connection
  const connection = await loadConnectionTokens(userId, "gmail");
  if (!connection) {
    throw new AppError("No Gmail connection found.", 404);
  }

  //list recent messages from sender
  const { gmail } = createGmailClient(connection);
  let messageIds: Array<{ id?: string | null }> = [];
  try {
    const response = await gmail.users.messages.list({
      userId: "me",
      q: `from:${senderEmail} newer_than:1d`,
      maxResults: 25,
    });
    messageIds = response.data.messages ?? [];
  } catch (error) {
    if (isInvalidGrantError(error)) {
      throw new AppError("Google access has expired. Please sign in again.", 401);
    }
    throw error;
  }

  if (messageIds.length === 0) {
    return [];
  }

  //find newsletter by sender
  const newsletters = await listNewsletters(userId);
  const newsletter = newsletters.find(
    (item) => item.sender.toLowerCase() === senderEmail.toLowerCase()
  );
  if (!newsletter) {
    return [];
  }

  //iterate messages to create episodes
  const createdEpisodes: IngestedEpisodeSeed[] = [];

  //iterate messages
  for (const message of messageIds) {
    if (!message.id) {
      continue;
    }
    try {
      //get message details and parse messages
      const detailResponse = await gmail.users.messages.get({
        userId: "me",
        id: message.id,
        format: "full",
      });
      const parsed = parseMessage(detailResponse.data as never);
      if (!parsed || !isNewsletterEmail(parsed.headers)) {
        continue;
      }
      //check for existing episode
      const existingEpisode = await getEpisodeBySourceMessageId(userId, parsed.id);
      if (existingEpisode) {
        continue;
      }
      //create episode
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
    } catch (error) {
      if (isInvalidGrantError(error)) {
        throw new AppError("Google access has expired. Please sign in again.", 401);
      }
      throw error;
    }
  }

  return createdEpisodes;
}
