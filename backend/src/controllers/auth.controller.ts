import type { Request, Response } from "express";
import { google } from "googleapis";

import { env } from "../config/env.js";
import { gmailScopes, oauthClient } from "../config/googleOAuth.js";
import { getOrCreateUserByEmail } from "../db/queries/users.sql.js";
import { storeConnectionTokens } from "../services/security/tokenStore.js";
import { toIsoDate } from "../utils/time.js";

//Creates the Google consent screen URL for user to go to when connecting email
export async function getGoogleAuthUrl(_req: Request, res: Response) {
  const url = oauthClient.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: gmailScopes,
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

  //create or get user by email in db
  const user = await getOrCreateUserByEmail(email, profile.data.name ?? null);

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

  //redirect user back to frontend
  if (env.FRONTEND_URL) {
    const redirectUrl = new URL("/settings", env.FRONTEND_URL);
    redirectUrl.searchParams.set("userId", user.id);
    redirectUrl.searchParams.set("email", user.email);
    redirectUrl.searchParams.set("connected", "1");
    res.redirect(redirectUrl.toString());
    return;
  }

  res.json({
    userId: user.id,
    email: user.email,
    redirect: `${env.BASE_URL}/settings`,
  });
}
