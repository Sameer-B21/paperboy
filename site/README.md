# Paperboy public site

Three static pages served at `paperboyhq.com`. No build step, no dependencies — plain
HTML and one stylesheet. Open any of them directly in a browser to preview.

| File | Lives at |
| --- | --- |
| `index.html` | `https://paperboyhq.com` |
| `privacy.html` | `https://paperboyhq.com/privacy` |
| `terms.html` | `https://paperboyhq.com/terms` |

These pages exist because **Google's OAuth verification for the `gmail.readonly`
restricted scope cannot be submitted without them** — it requires a homepage, a privacy
policy, and the Limited Use disclosure, all on a domain you have verified ownership of.
Apple separately requires a public privacy policy URL.

## Fill these in before publishing

- [x] **`terms.html` §11** — governing law set to Ontario, Canada.
- [ ] **`privacy.html` §6** — "Our cloud hosting provider" is deliberately generic
      because the host isn't chosen yet. Name it (Railway, Render, …) once you deploy.
- [ ] Read both documents end to end. They describe what the code actually does today,
      but you are the one publishing them.

## Deploying

Served by a **Cloudflare Worker** — `wrangler.jsonc` (repo root) binds `site/` as
static assets to the existing Worker `holy-sun-cb37`, which `paperboyhq.com` and
`www.paperboyhq.com` are already routed to as custom domains. `worker/index.js`
serves the assets and 301-redirects `www` → apex so the site has one canonical
address (see the comment in `wrangler.jsonc` — the Worker must keep that exact
name, since that's what the custom domain is bound to; renaming it creates a
second, unrouted Worker).

To deploy a change:

```bash
npx wrangler deploy
```

Clean URLs (`/privacy` rather than `/privacy.html`) work by default under this
setup.

## Then: the Google Cloud steps these pages unblock

1. **Verify the domain** at [Search Console](https://search.google.com/search-console)
   with a TXT record in Porkbun DNS. Nothing else works until this is done.
2. **Cloud Console → OAuth consent screen**: app homepage `https://paperboyhq.com`,
   privacy policy `https://paperboyhq.com/privacy`, terms `https://paperboyhq.com/terms`,
   add `paperboyhq.com` under Authorized domains, upload a logo.
3. **Submit for verification** and begin the CASA Tier 2 assessment.

## Keeping it honest

The privacy policy makes specific factual claims about the code. If any of these change,
change the policy in the same commit:

| Claim on the site | Where it's true in the code |
| --- | --- |
| Read-only Gmail access, three scopes | `backend/src/config/googleOAuth.ts` |
| Discovery scan: 50 messages, 30 days | `services/gmail/gmailSync.ts` |
| Daily fetch: selected senders only, 25 messages, 1 day | `services/gmail/gmailSync.ts` |
| Gemini gets ≤12k characters | `services/summarize/geminiDigest.ts` |
| Tokens encrypted with AES-256-GCM | `services/security/encrypt.ts` |
| Audio is private, reached by a signed 24h link | `middleware/requireUser.ts` |
| **Briefings deleted after 30 days** | `services/security/retention.ts`, `EPISODE_RETENTION_DAYS` |
| Delete Account wipes everything and revokes Google | `services/security/accountDeletion.ts` |
