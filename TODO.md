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
- [ ] Verify Supabase audio bucket is private — **manual check in the Supabase dashboard** (Storage → audio bucket → must not be "Public")

> Note: existing installs must sign in again (old sessions used the removed user-id model).

## Part 3 — Features Apple requires ✅ DONE (code)

- [x] **Account deletion in-app**: `DELETE /users/me` revokes the Google token, removes audio files, wipes all rows; "Delete Account" button with confirmation in settings (verified end-to-end)
- [x] Logout now calls `POST /auth/logout` — server revokes + drops its Gmail tokens
- [x] Settings links: Privacy Policy, Terms, Contact Support (**URLs are placeholders in `constants/links.ts` — replace with real hosted URLs before submission**)
- [ ] Sign in with Apple: likely exempt (app is a client for one specific service — Gmail); write reviewer notes for App Store Connect; add only if review pushes back

## Part 4 — Deployment

- [ ] Host backend on HTTPS (Railway/Render recommended); Supabase stays
- [ ] Set env vars on host; update `GOOGLE_REDIRECT_URI` (code + Google Cloud Console)
- [ ] Fix `backend/.env.example` (add `GOOGLE_TTS_API_KEY`; remove dead `OPENAI_TTS_*` vars)
- [ ] Revoke unused Gemini / ElevenLabs keys in local `backend/.env`
- [ ] Move episode generation out of the request path (background job + status polling); replace the 7 AM `setInterval` scheduler with host cron
- [ ] Commit SQL schema/migrations for the 4 Supabase tables
- [ ] Put production API URL in `eas.json` production profile

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
