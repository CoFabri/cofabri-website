import type { App } from '@/lib/api-client';

export function statusPillClasses(status: string): string {
  switch (status) {
    case 'Live':
    case 'Active':
      return 'bg-success/15 text-success';
    case 'Beta':
      return 'bg-accent text-accent-foreground';
    case 'In Development':
      return 'bg-muted text-muted-foreground';
    default:
      return 'bg-secondary text-secondary-foreground';
  }
}

export function actionLabel(app: App): string {
  return app.status === 'In Development' ? 'Join waitlist' : 'Visit';
}

export function actionHref(app: App): string {
  if (app.status === 'In Development') return `/signup?appId=${app.id}`;
  if (app.url) return app.url.startsWith('http') ? app.url : `https://${app.url}`;
  return '/apps';
}

export function isLaunchingToday(app: App): boolean {
  if (!app.launchDate) return false;
  const today = new Date();
  const launchDate = new Date(app.launchDate);
  return (
    launchDate.getDate() === today.getDate() &&
    launchDate.getMonth() === today.getMonth() &&
    launchDate.getFullYear() === today.getFullYear()
  );
}
