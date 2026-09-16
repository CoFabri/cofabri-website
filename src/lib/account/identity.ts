// src/lib/account/identity.ts
//
// Minimal signed-in identity for the sitewide header (avatar/email instead
// of a generic "Login" button) -- reads the same central cofabri_session
// cookie the /developers directory already reads (see
// developer-portal/session.ts's getDeveloperPortalAccessToken), and fetches
// cofabri-api's GET /web/api/account. This site never verifies the cookie
// itself; a missing/invalid/expired one just looks like "signed out" here,
// same reasoning as fetch-my-apps.ts.

const COFABRI_API_BASE_URL = process.env.COFABRI_API_BASE_URL;

export interface AccountIdentity {
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string | null;
}

interface AccountApiResponse {
  success: boolean;
  email: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
}

export async function getAccountIdentity(accessToken: string | null): Promise<AccountIdentity | null> {
  if (!accessToken || !COFABRI_API_BASE_URL) return null;

  try {
    const res = await fetch(`${COFABRI_API_BASE_URL}/web/api/account`, {
      headers: { Cookie: `cofabri_session=${accessToken}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = (await res.json()) as AccountApiResponse;
    return {
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email,
      avatarUrl: data.avatar_url,
    };
  } catch {
    return null;
  }
}
