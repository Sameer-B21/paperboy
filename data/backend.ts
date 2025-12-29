import { API_BASE_URL } from '@/constants/api';
import { getUserId } from '@/data/session';

type NewsletterResponse = {
  id: string;
  name: string;
  sender: string;
  selected: boolean;
  createdAt: string;
  updatedAt: string;
};

type EpisodeListItem = {
  id: string;
  subject: string;
  status: string;
  createdAt: string;
  sourceMessageId: string | null;
};

type EpisodeDetail = {
  id: string;
  subject: string;
  summary: string | null;
  script: string | null;
  status: string;
  audioUrl: string | null;
  audioDurationSeconds: number | null;
  createdAt: string;
};

const buildHeaders = async (isJson = true): Promise<HeadersInit> => {
  const headers: Record<string, string> = {};
  if (isJson) {
    headers['Content-Type'] = 'application/json';
  }
  const userId = await getUserId();
  if (userId) {
    headers['x-user-id'] = userId;
  }
  return headers;
};

async function requireUserId(): Promise<string> {
  const userId = await getUserId();
  if (!userId) {
    throw new Error('Missing EXPO_PUBLIC_USER_ID for backend requests.');
  }
  return userId;
}

export async function fetchAuthUrl(redirectUrl?: string): Promise<string> {
  const url = new URL(`${API_BASE_URL}/auth/google`);
  if (redirectUrl) {
    url.searchParams.set('redirect', redirectUrl);
  }
  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error('Unable to start Gmail auth.');
  }
  const payload = (await response.json()) as { url: string };
  return payload.url;
}

export async function syncGmail(): Promise<{ discovered: number }> {
  await requireUserId();
  const response = await fetch(`${API_BASE_URL}/gmail/sync`, {
    method: 'POST',
    headers: await buildHeaders(true),
  });
  if (!response.ok) {
    throw new Error('Unable to sync Gmail.');
  }
  return (await response.json()) as { discovered: number };
}

export async function listNewsletters(): Promise<NewsletterResponse[]> {
  await requireUserId();
  const response = await fetch(`${API_BASE_URL}/gmail/newsletters`, {
    headers: await buildHeaders(false),
  });
  if (!response.ok) {
    throw new Error('Unable to load newsletters.');
  }
  const payload = (await response.json()) as { newsletters: NewsletterResponse[] };
  return payload.newsletters ?? [];
}

export async function updateNewsletterSelection(
  newsletterId: string,
  selected: boolean
): Promise<NewsletterResponse> {
  await requireUserId();
  const response = await fetch(`${API_BASE_URL}/gmail/newsletters/${newsletterId}`, {
    method: 'PATCH',
    headers: await buildHeaders(true),
    body: JSON.stringify({ selected }),
  });
  if (!response.ok) {
    throw new Error('Unable to update newsletter selection.');
  }
  const payload = (await response.json()) as { newsletter: NewsletterResponse };
  return payload.newsletter;
}

export async function listEpisodes(): Promise<EpisodeListItem[]> {
  await requireUserId();
  const response = await fetch(`${API_BASE_URL}/episodes`, {
    headers: await buildHeaders(false),
  });
  if (!response.ok) {
    throw new Error('Unable to load briefs.');
  }
  const payload = (await response.json()) as { episodes: EpisodeListItem[] };
  return payload.episodes ?? [];
}

export async function getEpisode(episodeId: string): Promise<EpisodeDetail> {
  await requireUserId();
  const response = await fetch(`${API_BASE_URL}/episodes/${episodeId}`, {
    headers: await buildHeaders(false),
  });
  if (!response.ok) {
    throw new Error('Unable to load brief.');
  }
  return (await response.json()) as EpisodeDetail;
}

export async function generateDailyEpisode(): Promise<EpisodeDetail | null> {
  await requireUserId();
  const response = await fetch(`${API_BASE_URL}/episodes/daily`, {
    method: 'POST',
    headers: await buildHeaders(true),
  });
  if (response.status === 204) {
    return null;
  }
  if (!response.ok) {
    throw new Error('Unable to generate daily brief.');
  }
  return (await response.json()) as EpisodeDetail;
}

export async function getLatestDailyEpisode(): Promise<EpisodeDetail | null> {
  await requireUserId();
  const response = await fetch(`${API_BASE_URL}/episodes/daily/latest`, {
    headers: await buildHeaders(false),
  });
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error('Unable to load daily brief.');
  }
  return (await response.json()) as EpisodeDetail;
}
