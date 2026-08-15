import { google } from "googleapis";

import { env } from "./env.js";

//creates a fresh OAuth2 client per use — a shared client mutated with
//setCredentials leaks one user's tokens into another user's requests
export function createOAuthClient() {
  return new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    env.GOOGLE_REDIRECT_URI
  );
}

//permissions the app is requesting during the consent screen.
export const gmailScopes = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
];
