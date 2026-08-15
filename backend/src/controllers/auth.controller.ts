import type { Request, Response } from "express";
import { google } from "googleapis";
import jwt from "jsonwebtoken";

import { env } from "../config/env.js";
import { createOAuthClient, gmailScopes } from "../config/googleOAuth.js";
import { createUser, getUserByEmail } from "../db/queries/users.sql.js";
import { issueSessionToken } from "../middleware/requireUser.js";
import { storeConnectionTokens } from "../services/security/tokenStore.js";
import { toIsoDate } from "../utils/time.js";

//only the app's own schemes may receive the post-auth redirect; http(s) is
//limited to localhost during development so an attacker-supplied URL can
//never capture the session token
function isAllowedRedirect(candidate: URL): boolean {
  const appSchemes = new Set(["newsletterpodcaster:", "paperboy:", "exp:"]);
  if (appSchemes.has(candidate.protocol)) {
    return true;
  }
  if (env.NODE_ENV !== "production" && (candidate.protocol === "http:" || candidate.protocol === "https:")) {
    return candidate.hostname === "localhost" || candidate.hostname === "127.0.0.1";
  }
  return false;
}

//the state param is signed and short-lived so it cannot be forged or replayed
function encodeRedirectState(redirect: string): string {
  return jwt.sign({ redirect }, env.AUTH_JWT_SECRET, { expiresIn: "15m" });
}

function decodeRedirectState(state: unknown): string | null {
  if (!state || typeof state !== "string") {
    return null;
  }
  try {
    const payload = jwt.verify(state, env.AUTH_JWT_SECRET);
    if (typeof payload === "string" || typeof payload.redirect !== "string") {
      return null;
    }
    const candidate = new URL(payload.redirect);
    if (!isAllowedRedirect(candidate)) {
      return null;
    }
    return candidate.toString();
  } catch {
    return null;
  }
}

export async function getGoogleAuthUrl(req: Request, res: Response) {
  const redirectParam = req.query.redirect;
  const redirect =
    typeof redirectParam === "string" && redirectParam.length < 2000 ? redirectParam : null;
  const url = createOAuthClient().generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: gmailScopes,
    state: redirect ? encodeRedirectState(redirect) : undefined,
  });

  res.json({ url });
}

//called by Google after the user approves access, Google redirects to GOOGLE_REDIRECT_URI, which points to this handler
export async function handleGoogleCallback(req: Request, res: Response) {
  //ensures google code is present if not return error message
  const code = req.query.code;
  if (!code || typeof code !== "string") {
    res.status(400).json({ error: "Missing auth code." });
    return;
  }

  //using the code to get access token from google
  const oauthClient = createOAuthClient();
  const { tokens } = await oauthClient.getToken(code);
  oauthClient.setCredentials(tokens);
  if (!tokens.access_token) {
    res.status(400).json({ error: "Gmail did not return an access token." });
    return;
  }

  //get users profile and email
  const oauth2 = google.oauth2({ version: "v2", auth: oauthClient });
  const profile = await oauth2.userinfo.get();
  const email = profile.data.email;
  if (!email) {
    res.status(400).json({ error: "Unable to read Gmail profile email." });
    return;
  }

  //look up user by email in db to decide onboarding flow
  const existingUser = await getUserByEmail(email);
  const isNewUser = !existingUser;
  const user = existingUser ?? (await createUser(email, profile.data.name ?? null));

  //store oauth token as connections
  await storeConnectionTokens({
    userId: user.id,
    provider: "gmail",
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token ?? null,
    scope: tokens.scope ?? null,
    expiresAt: toIsoDate(tokens.expiry_date ?? null),
    email,
  });

  //the signed session token is the app's credential for every later request
  const sessionToken = issueSessionToken(user.id);

  const redirectTarget = decodeRedirectState(req.query.state);
  if (redirectTarget) {
    const redirectUrl = new URL(redirectTarget);
    redirectUrl.searchParams.set("token", sessionToken);
    redirectUrl.searchParams.set("email", user.email);
    redirectUrl.searchParams.set("connected", "1");
    redirectUrl.searchParams.set("isNew", isNewUser ? "1" : "0");
    res.redirect(redirectUrl.toString());
    return;
  }

  //redirect user back to frontend
  if (env.FRONTEND_URL) {
    const redirectUrl = new URL("/settings", env.FRONTEND_URL);
    redirectUrl.searchParams.set("token", sessionToken);
    redirectUrl.searchParams.set("email", user.email);
    redirectUrl.searchParams.set("connected", "1");
    redirectUrl.searchParams.set("isNew", isNewUser ? "1" : "0");
    res.redirect(redirectUrl.toString());
    return;
  }

  res.json({
    token: sessionToken,
    email: user.email,
    isNew: isNewUser,
    redirect: `${env.BASE_URL}/settings`,
  });
}
