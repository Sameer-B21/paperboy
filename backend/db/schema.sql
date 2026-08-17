-- Paperboy database schema (Supabase / Postgres)
--
-- The live schema was originally created by hand in the Supabase dashboard;
-- this file is the committed source of truth so a new environment can be
-- stood up from scratch. Run it in the Supabase SQL editor (or psql).
--
-- Storage: create a PRIVATE bucket named "audio" (Storage → New bucket).

create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text,
  podcast_duration_minutes integer,
  -- Hour of day (UTC, 0-23) the user wants their daily digest; null = server default
  digest_utc_hour integer,
  created_at timestamptz not null default now()
);

create table if not exists connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  provider text not null,
  access_token text not null,
  refresh_token text,
  scope text,
  expires_at timestamptz,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);

create table if not exists newsletters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  name text not null,
  sender text not null,
  selected boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, sender)
);

create table if not exists episodes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  newsletter_id uuid references newsletters (id) on delete set null,
  title text,
  subject text not null,
  body text,
  summary text,
  script text,
  tts_voice text,
  audio_path text,
  audio_duration_seconds double precision,
  status text not null default 'queued',
  source_message_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists episodes_user_created_idx on episodes (user_id, created_at desc);
create index if not exists episodes_user_source_idx on episodes (user_id, source_message_id);

-- The backend uses the service-role key, which bypasses RLS. Enabling RLS
-- with no policies blocks the anon/public keys entirely — defense in depth.
alter table users enable row level security;
alter table connections enable row level security;
alter table newsletters enable row level security;
alter table episodes enable row level security;
