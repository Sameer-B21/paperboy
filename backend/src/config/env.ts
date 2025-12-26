import dotenv from "dotenv";

dotenv.config();
// import 'dotenv/config';

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
  OPENAI_API_KEY: string;
  OPENAI_MODEL?: string;
  FRONTEND_URL?: string;
};

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return value;
}

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
  OPENAI_API_KEY: requireEnv("OPENAI_API_KEY"),
  OPENAI_MODEL: process.env.OPENAI_MODEL,
  FRONTEND_URL: process.env.FRONTEND_URL,
};
