import dotenv from "dotenv";

dotenv.config();


//env parameters
export type Env = {
  NODE_ENV: string;
  PORT: number;
  BASE_URL: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  SUPABASE_AUDIO_BUCKET: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_REDIRECT_URI: string;
  TOKEN_ENCRYPTION_KEY: string;
  AUTH_JWT_SECRET: string;
  GEMINI_API_KEY: string;
  GEMINI_MODEL?: string;
  TTS_VOICE?: string;
  FRONTEND_URL?: string;
  GOOGLE_TTS_API_KEY: string;
  CRON_SECRET?: string;
  ENABLE_SCHEDULER: boolean;
  EPISODE_RETENTION_DAYS: number;
};

//function that forcess specific environment variables to exist and returns value
function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return value;
}

//variable that holds all environment variables
export const env: Env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: Number.parseInt(process.env.PORT ?? "3001", 10),
  BASE_URL: requireEnv("BASE_URL"),
  SUPABASE_URL: requireEnv("SUPABASE_URL"),
  SUPABASE_SERVICE_ROLE_KEY: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  SUPABASE_AUDIO_BUCKET: process.env.SUPABASE_AUDIO_BUCKET ?? "audio",
  GOOGLE_CLIENT_ID: requireEnv("GOOGLE_CLIENT_ID"),
  GOOGLE_CLIENT_SECRET: requireEnv("GOOGLE_CLIENT_SECRET"),
  GOOGLE_REDIRECT_URI: requireEnv("GOOGLE_REDIRECT_URI"),
  TOKEN_ENCRYPTION_KEY: requireEnv("TOKEN_ENCRYPTION_KEY"),
  AUTH_JWT_SECRET: requireEnv("AUTH_JWT_SECRET"),
  GEMINI_API_KEY: requireEnv("GEMINI_API_KEY"),
  GEMINI_MODEL: process.env.GEMINI_MODEL,
  TTS_VOICE: process.env.TTS_VOICE,
  FRONTEND_URL: process.env.FRONTEND_URL,
  GOOGLE_TTS_API_KEY: requireEnv("GOOGLE_TTS_API_KEY"),
  CRON_SECRET: process.env.CRON_SECRET,
  //in-process scheduler (per-user delivery hours); disable on hosts that trigger /internal/cron/daily hourly instead
  ENABLE_SCHEDULER: process.env.ENABLE_SCHEDULER !== "false",
  //episodes (which hold newsletter text) are purged after this many days.
  //This number is published in the privacy policy — keep the two in step.
  EPISODE_RETENTION_DAYS: Number.parseInt(process.env.EPISODE_RETENTION_DAYS ?? "30", 10),
};
