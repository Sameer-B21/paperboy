import { createClient } from "@supabase/supabase-js";

import { env } from "./env.js";

//creates a Supabase client that the backend can use to talk to
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

//grabbing the Storage bucket name for audio files
export const audioBucket = env.SUPABASE_AUDIO_BUCKET;
