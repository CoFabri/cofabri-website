// Health-information wording on /support only applies to healthcare apps.
// Unknown app (nothing selected) keeps the notice; while apps load we show
// nothing so it cannot flash for a non-healthcare app.
export function shouldShowHealthNotice(
  selectedAppIds: string[],
  apps: { id: string; category?: string | null }[],
  appsLoaded: boolean,
): boolean {
  if (!appsLoaded) return false;
  if (selectedAppIds.length === 0) return true;
  return selectedAppIds.some((id) =>
    apps.some((a) => a.id === id && (a.category ?? '').trim().toLowerCase() === 'healthcare'),
  );
}
