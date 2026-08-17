import { API_BASE_URL } from '@/constants/api';
import { getAuthToken } from '@/data/session';

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
  voice?: string | null;
  createdAt: string;
  sourceMessageId: string | null;
};

type EpisodeDetail = {
  id: string;
  subject: string;
  summary: string | null;
  script: string | null;
  status: string;
  voice?: string | null;
  audioUrl: string | null;
  audioDurationSeconds: number | null;
  createdAt: string;
};

type UserProfile = {
  id: string;
  email: string;
  name: string | null;
  digestUtcHour: number | null;
  createdAt: string;
};

//auth headers for requests made outside this module (e.g. audio streaming)
export const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const token = await getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const buildHeaders = async (isJson = true): Promise<HeadersInit> => {
  const headers: Record<string, string> = await getAuthHeaders();
  if (isJson) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
};

async function requireSession(): Promise<void> {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('No user session found — please sign in again.');
  }
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
  await requireSession();
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
  await requireSession();
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
  await requireSession();
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
  await requireSession();
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
  await requireSession();
  const response = await fetch(`${API_BASE_URL}/episodes/${episodeId}`, {
    headers: await buildHeaders(false),
  });
  if (!response.ok) {
    throw new Error('Unable to load brief.');
  }
  return (await response.json()) as EpisodeDetail;
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

//generation runs in the background on the server; poll the episode until it
//reaches a terminal status
async function pollEpisodeUntilReady(episodeId: string): Promise<EpisodeDetail> {
  const deadline = Date.now() + 6 * 60 * 1000;
  while (Date.now() < deadline) {
    await sleep(4000);
    const episode = await getEpisode(episodeId);
    if (episode.status === 'failed') {
      throw new Error('Unable to generate daily brief. Please try again.');
    }
    if (episode.status === 'completed') {
      return episode;
    }
  }
  throw new Error('Brief generation timed out. Please try again.');
}

export async function generateDailyEpisode(voice?: string): Promise<EpisodeDetail | null> {
  await requireSession();
  const body = voice ? JSON.stringify({ voice }) : undefined;
  const response = await fetch(`${API_BASE_URL}/episodes/daily`, {
    method: 'POST',
    headers: await buildHeaders(true),
    body,
  });
  if (response.status === 204) {
    return null;
  }
  if (!response.ok) {
    throw new Error('Unable to generate daily brief.');
  }
  const payload = (await response.json()) as EpisodeDetail;
  if (response.status === 202) {
    return pollEpisodeUntilReady(payload.id);
  }
  return payload;
}

export async function updateUserPreferences(prefs: {
  podcastDurationMinutes?: number;
  digestUtcHour?: number;
}): Promise<void> {
  await requireSession();
  const response = await fetch(`${API_BASE_URL}/users/me`, {
    method: 'PATCH',
    headers: await buildHeaders(true),
    body: JSON.stringify(prefs),
  });
  if (!response.ok) {
    throw new Error('Unable to update preferences.');
  }
}

export async function getLatestDailyEpisode(): Promise<EpisodeDetail | null> {
  await requireSession();
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

//tells the server to revoke + drop its stored Gmail tokens; best effort —
//local logout should not be blocked by a network failure
export async function logoutOnServer(): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: await buildHeaders(false),
    });
  } catch {
    // Ignore network errors; the local session is cleared regardless.
  }
}

//permanently deletes the account and all server-side data
export async function deleteAccount(): Promise<void> {
  await requireSession();
  const response = await fetch(`${API_BASE_URL}/users/me`, {
    method: 'DELETE',
    headers: await buildHeaders(false),
  });
  if (!response.ok) {
    throw new Error('Unable to delete account. Please try again.');
  }
}

export async function fetchUserProfile(): Promise<UserProfile> {
  await requireSession();
  const response = await fetch(`${API_BASE_URL}/users/me`, {
    headers: await buildHeaders(false),
  });
  if (!response.ok) {
    throw new Error('Unable to load user profile.');
  }
  const payload = (await response.json()) as { user: UserProfile };
  return payload.user;
}
