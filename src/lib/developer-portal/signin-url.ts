// src/lib/developer-portal/signin-url.ts

import { DEVELOPER_PORTAL_APP_ID } from './session';

const COFABRI_API_BASE_URL = process.env.COFABRI_API_BASE_URL;

// Goes through the same central sign-in (/web/account) as the site-wide
// Navbar "Login" button, not the old per-app /web/signin/:appId page --
// cofabri-website is registered as its own app_id there only so its row
// exists for the central Account page's "Your apps" list and for
// apps.login_redirect_url to point at /developers/callback, not as a
// standalone sign-in entry point. ?returnApp shows a "Back to {App}"
// banner on /web/account and is what the authenticated Account page's
// "Continue" action for this app uses to redirect back through
// /developers/callback?access_token=... -- the same callback this route
// already expects, so nothing else in this app had to change.
export function getDeveloperPortalSigninUrl(): string {
  if (!COFABRI_API_BASE_URL) {
    throw new Error('COFABRI_API_BASE_URL is not configured');
  }
  return `${COFABRI_API_BASE_URL}/web/account?returnApp=${DEVELOPER_PORTAL_APP_ID}`;
}
