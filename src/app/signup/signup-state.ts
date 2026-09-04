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

// Only called for states that hide the form and show a block instead —
// 'legacy-waitlist' and 'open' keep showing the real form and never reach here.
export function getSignupCopy(state: SignupState, appName: string): { title: string; body: string } {
  switch (state.kind) {
    case 'not-open':
      return {
        title: `Beta signups for ${appName} aren't open yet`,
        body: "We're not accepting beta signups for this app just yet. Check back soon.",
      };
    case 'closed':
      return {
        title: `Beta signups for ${appName} are closed`,
        body: 'This beta is no longer accepting new signups.',
      };
    case 'full':
      return {
        title: `All beta spots for ${appName} are filled`,
        body: 'Every spot has been claimed. Check back later or explore our other apps.',
      };
    case 'unavailable':
      return state.status === 'Live' || state.status === 'Active'
        ? { title: `${appName} is live!`, body: 'This app has launched — head over and start using it.' }
        : {
            title: `Beta signups aren't available for ${appName} right now`,
            body: 'This signup page is not currently available for this app.',
          };
    case 'legacy-waitlist':
    case 'open':
      throw new Error(`getSignupCopy called for a state that still shows the form: ${state.kind}`);
  }
}
