# Paperboy — App Store Readiness TODO

Roadmap for getting Paperboy published on the iOS App Store.
(⏳ = long external wait, start early)

## Part 1 — App identity & configuration ✅ DONE

- [x] Rename app to **Paperboy** in `app.json`
- [x] Dedupe `UIBackgroundModes` (`["audio","audio"]` → `["audio"]`)
- [x] Add `ITSAppUsesNonExemptEncryption: false`
- [x] Remove the auto-added microphone permission (`expo-av` plugin config)
- [x] Privacy manifest: declare email address, name, email content collected
- [x] Widget/Live Activity version now follows app version (`plugins/withLiveActivity.js`)
- [x] Delete template leftovers (modal screen, unused components, react-logo images)
- [x] Remove backend-only deps from app `package.json` (`express`, `cors`, `music-metadata`, `@supabase/supabase-js`); `expo-dev-client` → devDependencies
- [x] Fix stale `EXPO_PUBLIC_USER_ID` error message in `data/backend.ts`
- [x] Untrack root `.env` from git (history checked — no secrets, no rewrite needed)
- [x] Verified: clean prebuild + full simulator build succeeds
- [x] Pushed to GitHub (`781c30e`, `1c7f70c`)

## Part 2 — Backend security ✅ DONE (code)

- [x] Real login: signed JWT issued at OAuth callback, stored in the iOS keychain (`expo-secure-store`), sent as `Authorization: Bearer`; `requireUser` middleware on all user routes
- [x] Remove the `x-user-id` / `?userId=` trust model
- [x] Remove passwordless `POST /auth/signup`
- [x] Fix IDOR: `getEpisode` / `getEpisodeAudio` now check episode ownership
- [x] Stop embedding `userId` in audio URLs (player sends the auth header instead)
- [x] Close the OAuth open redirect — `state` is now a signed, 15-minute token and only app schemes (+ localhost in dev) are allowed
- [x] Fix shared `oauthClient` singleton (fresh client per request); refreshed access tokens now persisted
- [x] Lock down CORS to `FRONTEND_URL`; add `helmet` + rate limiting (global 300/15min, auth 30/15min, generation 10/day/user)
- [x] Move `GOOGLE_TTS_API_KEY` to the `X-Goog-Api-Key` header
- [x] Restore input truncation in `chatgptDigest.ts` (12k chars)
- [x] `AUTH_JWT_SECRET` added to `backend/.env` (generated) and `.env.example`; `.env.example` also fixed (added `GOOGLE_TTS_API_KEY`, removed dead `OPENAI_TTS_*`)
- [x] Verify Supabase audio bucket is private (checked in the Supabase dashboard — not public)

> Note: existing installs must sign in again (old sessions used the removed user-id model).

## Part 3 — Features Apple requires ✅ DONE (code)

- [x] **Account deletion in-app**: `DELETE /users/me` revokes the Google token, removes audio files, wipes all rows; "Delete Account" button with confirmation in settings (verified end-to-end)
- [x] Logout now calls `POST /auth/logout` — server revokes + drops its Gmail tokens
- [x] Settings links: Privacy Policy, Terms, Contact Support (**URLs are placeholders in `constants/links.ts` — replace with real hosted URLs before submission**)
- [ ] Sign in with Apple: likely exempt (app is a client for one specific service — Gmail); write reviewer notes for App Store Connect; add only if review pushes back

## Part 4 — Deployment (code ✅ / hosting steps are yours)

- [x] Episode generation moved out of the request path: `POST /episodes/daily` returns 202 + episode id instantly, work runs in the background, app polls until `completed`/`failed` (verified: 202 in <1s)
- [x] Host-cron endpoint `POST /internal/cron/daily` (guarded by `CRON_SECRET` header); in-process scheduler can be disabled with `ENABLE_SCHEDULER=false` (a host cron must then fire **hourly**)
- [x] **User-chosen delivery time**: `users.digest_utc_hour` column; "Delivery Time" picker in settings; the app converts the chosen local hour to UTC so the server never stores timezones. Scheduler now runs hourly and generates only for users whose hour arrived (no pick yet → 7 AM server time)
- [x] Wrapped all async route handlers in `asyncHandler` — on Express 4 a rejected promise was crashing the process instead of returning 500
- [x] `Dockerfile` + `.dockerignore` in `backend/` (multi-stage, `node:22-alpine`); fixed backend `tsconfig` so `npm run build` actually emits `dist/`
- [x] Graceful shutdown (SIGTERM/SIGINT) and `/health` now pings Supabase
- [x] SQL schema committed: `backend/db/schema.sql` (4 tables, FKs with cascade delete, RLS enabled)
- [x] `eas.json` production profile has the `EXPO_PUBLIC_API_BASE_URL` slot (**placeholder — set the real URL after deploying**)
- [x] `backend/.env.example` covers all required vars incl. `CRON_SECRET` / `ENABLE_SCHEDULER`

**Manual deploy steps (you):**
- [ ] Create a Railway or Render service from the repo (`backend/` dir, Dockerfile build); set all env vars from `.env.example` (generate fresh `AUTH_JWT_SECRET` + `CRON_SECRET` for prod; `ENABLE_SCHEDULER=false` if using host cron)
- [ ] Set `BASE_URL` + `GOOGLE_REDIRECT_URI` to the deployed HTTPS URL; add that redirect URI in Google Cloud Console
- [ ] Add a host cron job: daily 7 AM → `POST https://<host>/internal/cron/daily` with `x-cron-secret` header
- [ ] Replace the placeholder URL in `eas.json`
- [ ] Revoke unused Gemini / ElevenLabs keys sitting in local `backend/.env`

## Part 5 — External (no code)

- [ ] Apple Developer Program ($99/yr)
- [ ] **Real bundle ID** (replace `com.anonymous.NewsletterPodcaster`) — deferred from Part 1; must happen *before* Google OAuth verification
- [ ] ⏳ Google OAuth verification + CASA Tier 2 security assessment for `gmail.readonly` (weeks–months, ~$500–4,500/yr; 100-user cap until approved) — **start as soon as privacy policy + domain exist**
- [ ] Privacy policy + terms hosted at a public URL (disclose: Gmail read/stored, sent to OpenAI + Google TTS, retention, deletion)
- [ ] Domain name (API + privacy policy)
- [ ] App Store Connect: app record, name check, screenshots, description, privacy questionnaire
- [ ] `eas.json` submit config (`appleId`, `ascAppId`, `appleTeamId`)
- [ ] TestFlight beta pass end-to-end
- [ ] Submit for review

## Potential Upgrades (post-launch, not blocking)

- [ ] **80+ language support**: currently English-only (8 curated Google Chirp3-HD/Journey voices, `en-US`). Letting users pick a digest language would need voice selection, prompt/summarization changes for non-English newsletters, and locale-aware UI copy.
- [ ] **Fish Audio as an additional/opt-in TTS provider**: ~2x cheaper than Google Chirp3-HD (~$15/1M bytes vs. ~$30/1M chars) and offers zero-shot voice cloning (10s sample) as a differentiated feature (e.g. "narrate in your own voice"). Not a replacement for Google TTS — Fish Audio is operated by a China-based company, so routing Gmail-derived content through it needs new privacy-policy disclosures and could complicate the in-flight Google OAuth verification / CASA Tier 2 assessment (Part 5). Revisit only after that verification is done, as an additive premium voice option, not a swap.
