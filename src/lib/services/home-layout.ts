// How the home page's Services section lays out its services, by how many there are.
// One service: a single horizontal card. Two: two columns from 768. Three: three columns from 1024.
// Four: two by two (four across is too narrow for the open Notify Me field). Five or more: no cards,
// only the heading, the line and a link to /services.

export type HomeServicesLayout = 'solo' | 'cards' | 'link-only' | 'none';

export function homeServicesLayout(count: number): HomeServicesLayout {
  if (count <= 0) return 'none';
  if (count === 1) return 'solo';
  return count <= 4 ? 'cards' : 'link-only';
}

/** Grid classes for the card layout (two to four services). */
export function homeCardsGridClass(count: number): string {
  const base = 'grid grid-cols-1 gap-6 md:grid-cols-2';
  return count === 3 ? `${base} lg:grid-cols-3` : base;
}

/** "All Services", or "All 6 Services" when the cards are left out. */
export function allServicesLabel(count: number): string {
  return homeServicesLayout(count) === 'link-only' ? `All ${count} Services` : 'All Services';
}

export type HomeServicesState = { status: 'loading' } | { status: 'error' } | { status: 'ready'; count: number };

/** What to show: a skeleton while loading, nothing on an error or when there are no services. */
export function homeServicesView(state: HomeServicesState): 'skeleton' | 'hidden' | 'section' {
  if (state.status === 'loading') return 'skeleton';
  if (state.status === 'error') return 'hidden';
  return state.count > 0 ? 'section' : 'hidden';
}
