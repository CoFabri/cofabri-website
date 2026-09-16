// src/lib/developer-portal/session.ts
//
// Reads the same central session cookie (cofabri_session) the rest of the
// site's sign-in flow sets, shared across cofabri.com via
// CentralSessionCookie's CENTRAL_ACCOUNT_ROOT_DOMAIN-scoped cookie domain.
// This site never verifies the cookie itself (it's HMAC-signed by
// cofabri-api, opaque here) -- it just forwards the raw value as a Cookie
// header on server-to-server calls to cofabri-api, which is the one that
// actually authenticates it. A missing or invalid cookie both look like
// "signed out" here; cofabri-api's own 401 is what tells them apart.
//
// Used by the sitewide Navbar (account/@lib/account/identity.ts) to render
// real identity when signed in. /developers itself no longer needs this --
// it's public now, not gated behind sign-in (see that page's own comment).

import { cookies } from 'next/headers';

const CENTRAL_SESSION_COOKIE = 'cofabri_session';

export async function getDeveloperPortalAccessToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(CENTRAL_SESSION_COOKIE)?.value ?? null;
}
