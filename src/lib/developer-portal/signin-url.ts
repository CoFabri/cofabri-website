// src/lib/developer-portal/signin-url.ts

import { DEVELOPER_PORTAL_APP_ID } from './session';

const COFABRI_API_BASE_URL = process.env.COFABRI_API_BASE_URL;

// Goes through the same central sign-in (/web/account) as the site-wide
// Navbar "Login" button, not the old per-app /web/signin/:appId page.
// Signing in there sets cofabri_session, shared across all of cofabri.com
// (CentralSessionCookie + CENTRAL_ACCOUNT_ROOT_DOMAIN) -- /developers picks
// that cookie straight up (session.ts) with no redirect handoff needed.
// cofabri-website is registered as its own app_id in cofabri-api only so
// its row exists for the central Account page's "Your apps" listing, not
// because this site has real per-app user accounts the way Medoura/Praxis/
// etc. do -- so the Account page's per-app "Continue" resolution always
// comes up empty for it, which is expected, not a bug. ?returnApp here is
// purely for the "Back to {App}" banner on /web/account -- a courtesy link
// back to /developers, not part of how sign-in actually completes.
export function getDeveloperPortalSigninUrl(): string {
  if (!COFABRI_API_BASE_URL) {
    throw new Error('COFABRI_API_BASE_URL is not configured');
  }
  return `${COFABRI_API_BASE_URL}/web/account?returnApp=${DEVELOPER_PORTAL_APP_ID}`;
}
