export type SignupState =
  | { kind: 'legacy-waitlist' }
  | { kind: 'not-open' }
  | { kind: 'closed' }
  | { kind: 'full'; capacity: number; filled: number }
  | { kind: 'open'; capacity: number; filled: number; remaining: number }
  | { kind: 'unavailable'; status: string };

interface SignupAppData {
  status: string;
  betaCapacity: number | null;
  betaSpotsFilled: number;
}

// This page serves two unrelated funnels: the legacy pre-launch waitlist
// (status 'In Development', unlimited, unchanged by this feature) and the
// capacity-limited beta signup (status 'Beta'). Anything else means a stale
// or direct link pointed here for an app this page no longer serves.
export function getSignupState(appData: SignupAppData): SignupState {
  if (appData.status === 'In Development') return { kind: 'legacy-waitlist' };
  if (appData.status !== 'Beta') return { kind: 'unavailable', status: appData.status };
  if (appData.betaCapacity == null) return { kind: 'not-open' };
  if (appData.betaCapacity === 0) return { kind: 'closed' };

  const remaining = appData.betaCapacity - appData.betaSpotsFilled;
  if (remaining <= 0) return { kind: 'full', capacity: appData.betaCapacity, filled: appData.betaSpotsFilled };
  return { kind: 'open', capacity: appData.betaCapacity, filled: appData.betaSpotsFilled, remaining };
}

export interface SignupCopy {
  eyebrow: string;
  title: string;
  body: string;
  cta: { label: string; href: string };
  cta2: { label: string; href: string };
}

// Only called for states that hide the form and show a block instead —
// 'legacy-waitlist' and 'open' keep showing the real form and never reach here.
export function getSignupCopy(state: SignupState, appName: string, appId = ''): SignupCopy {
  const explore = { label: 'Explore apps', href: '/apps' };
  switch (state.kind) {
    case 'not-open':
      return {
        eyebrow: 'Beta not open',
        title: `${appName} beta signups open soon`,
        body: "We're not taking beta signups yet. Check back shortly.",
        cta: explore,
        cta2: { label: 'Roadmap', href: '/roadmaps' },
      };
    case 'closed':
      return {
        eyebrow: 'Beta closed',
        title: `The ${appName} beta has closed`,
        body: "It's no longer taking new signups. It opens to everyone at launch.",
        cta: explore,
        cta2: { label: 'Roadmap', href: '/roadmaps' },
      };
    case 'full':
      return {
        eyebrow: 'Beta full',
        title: `Every beta spot for ${appName} is taken`,
        body: `All ${state.capacity} spots have been claimed. We'll open more as the beta grows.`,
        cta: explore,
        cta2: { label: 'Contact us', href: '/contact' },
      };
    case 'unavailable':
      return state.status === 'Live' || state.status === 'Active'
        ? {
            eyebrow: 'Launched',
            title: `${appName} is live`,
            body: "There's no waitlist anymore — sign up and start using it.",
            cta: { label: `View ${appName}`, href: appId ? `/apps/${appId}` : '/apps' },
            cta2: { label: 'All apps', href: '/apps' },
          }
        : {
            eyebrow: 'Unavailable',
            title: `Signups for ${appName} aren't open right now`,
            body: "This page isn't taking signups for this app at the moment.",
            cta: explore,
            cta2: { label: 'Contact us', href: '/contact' },
          };
    case 'legacy-waitlist':
    case 'open':
      throw new Error(`getSignupCopy called for a state that still shows the form: ${state.kind}`);
  }
}
