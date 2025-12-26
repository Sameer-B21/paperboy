import { google } from "googleapis";
import type { Request, Response } from "express";

import { oauthClient, gmailScopes } from "../config/googleOAuth.js";
import { getOrCreateUserByEmail } from "../db/queries/users.sql.js";
import { storeConnectionTokens } from "../services/security/tokenStore.js";
import { toIsoDate } from "../utils/time.js";
import { env } from "../config/env.js";

export async function getGoogleAuthUrl(_req: Request, res: Response) {
  const url = oauthClient.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: gmailScopes,
  });

  res.json({ url });
}

export async function handleGoogleCallback(req: Request, res: Response) {
  const code = req.query.code;
  if (!code || typeof code !== "string") {
    res.status(400).json({ error: "Missing auth code." });
    return;
  }

  const { tokens } = await oauthClient.getToken(code);
  oauthClient.setCredentials(tokens);
  if (!tokens.access_token) {
    res.status(400).json({ error: "Gmail did not return an access token." });
    return;
  }

  const oauth2 = google.oauth2({ version: "v2", auth: oauthClient });
  const profile = await oauth2.userinfo.get();
  const email = profile.data.email;

  if (!email) {
    res.status(400).json({ error: "Unable to read Gmail profile email." });
    return;
  }

  const user = await getOrCreateUserByEmail(email, profile.data.name ?? null);
  await storeConnectionTokens({
    userId: user.id,
    provider: "gmail",
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token ?? null,
    scope: tokens.scope ?? null,
    expiresAt: toIsoDate(tokens.expiry_date ?? null),
    email,
  });

  res.json({
    userId: user.id,
    email: user.email,
    redirect: `${env.BASE_URL}/settings`,
  });
}
