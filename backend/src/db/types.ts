export type User = {
  id: string;
  email: string;
  name: string | null;
  podcastDurationMinutes: number | null;
  createdAt: string;
};

export type Connection = {
  id: string;
  userId: string;
  provider: "gmail";
  accessToken: string;
  refreshToken: string | null;
  scope: string | null;
  expiresAt: string | null;
  email: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Newsletter = {
  id: string;
  userId: string;
  name: string;
  sender: string;
  selected: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Episode = {
  id: string;
  userId: string;
  newsletterId: string | null;
  subject: string;
  body: string | null;
  summary: string | null;
  script: string | null;
  voice: string | null;
  audioPath: string | null;
  audioDurationSeconds: number | null;
  status: "queued" | "completed" | "failed";
  sourceMessageId: string | null;
  createdAt: string;
  updatedAt: string;
};
