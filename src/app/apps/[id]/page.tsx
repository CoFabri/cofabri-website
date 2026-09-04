import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { getApp, getAppReleases, getRoadmapFeatures } from '@/lib/api-client';
import { getSystemStatus } from '@/lib/airtable';
import { actionHref, actionLabel, hasActiveRoadmap, statusExplainer, statusPillClasses } from '@/lib/app-display';
import { incidentDotClasses, matchAppIncident } from '@/lib/incident-display';
import { roadmapStatusPillClasses, formatRoadmapWhen } from '@/lib/roadmap-display';
import Breadcrumbs from '@/components/marketing/Breadcrumbs';
import StructuredData from '@/components/marketing/StructuredData';

interface AppDetailPageProps {
  params: Promise<{ id: string }>;
}

function formatDate(value?: string): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function hostname(url?: string): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export async function generateMetadata({ params }: AppDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const app = await getApp(id);

  if (!app) {
    return {
      title: 'App Not Found',
      description: 'The requested app could not be found.',
    };
  }

  const description = app.description?.slice(0, 160) || `${app.name} — part of the CoFabri suite.`;

  return {
    title: app.name,
    description,
    alternates: {
      canonical: `/apps/${id}`,
    },
    openGraph: {
      title: `${app.name} | CoFabri`,
      description,
      url: `https://cofabri.com/apps/${id}`,
      images: [
        { url: 'https://files.cofabri.com/logos/cofabri/cofabri-og-image.png', width: 1200, height: 630, alt: 'CoFabri' },
      ],
    },
    twitter: {
      title: `${app.name} | CoFabri`,
      description,
      images: ['https://files.cofabri.com/logos/cofabri/cofabri-og-image.png'],
    },
  };
}

export default async function AppDetailPage({ params }: AppDetailPageProps) {
  const { id } = await params;
  const app = await getApp(id);

  if (!app) {
    notFound();
  }

  const roadmapFeatures = await getRoadmapFeatures();
  const appFeatures = hasActiveRoadmap(app.status) ? roadmapFeatures.filter((f) => f.application === app.id) : [];
  // "Released" roadmap items excluded here — app_roadmaps is a largely-stale
  // one-time import, not what's actually shipping. app_releases_public (via
  // getAppReleases) is the team's real, currently-maintained release feed.
  const roadmapItems = appFeatures.filter((f) => f.status !== 'Released').slice(0, 5);
  const shippedItems = hasActiveRoadmap(app.status) ? await getAppReleases(app.id) : [];
  const features = [app.feature1, app.feature2, app.feature3].filter((f): f is string => !!f);

  // Only fully live apps get a status dot — an uptime signal reads as noise
  // (or actively misleading) on something still in development or beta.
  const showStatusDot = app.status === 'Live' || app.status === 'Active';
  const statusIncident = showStatusDot ? matchAppIncident(app.name, await getSystemStatus()) : undefined;

  const meta = (
    [
      { k: 'Category', v: app.category },
      { k: 'Status', v: app.status },
      { k: 'Launched', v: formatDate(app.launchDate) },
      { k: 'Latest release', v: formatDate(app.releaseDate) },
      { k: 'Website', v: hostname(app.url) },
    ] as { k: string; v: string | undefined }[]
  ).filter((row): row is { k: string; v: string } => !!row.v);

  return (
    <div className="min-h-screen bg-background">
      <StructuredData
        type="softwareApplication"
        data={{
          name: app.name,
          description: app.description,
          url: app.url ? `https://${hostname(app.url)}` : `https://cofabri.com/apps/${app.id}`,
          applicationCategory: app.category,
        }}
      />
      <div className="mx-auto max-w-[1200px] px-6 pt-9 pb-24 sm:px-10">
        <div className="mb-14">
          <Breadcrumbs items={[{ name: 'Apps', href: '/apps' }, { name: app.name, href: `/apps/${app.id}` }]} />
        </div>

        <div className="grid grid-cols-1 items-start gap-14 lg:grid-cols-[1fr_460px] lg:gap-20">
          <div>
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <span className={`rounded-full px-2.5 py-1.5 text-xs font-semibold ${statusPillClasses(app.status)}`}>
                {app.status}
              </span>
              {app.category && (
                <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-faint">{app.category}</span>
              )}
              {showStatusDot && (
                <Link
                  href="/status"
                  title={`System status: ${statusIncident ? statusIncident.publicStatus : 'Operational'}`}
                  aria-label={`System status: ${statusIncident ? statusIncident.publicStatus : 'Operational'}`}
                  className="inline-flex h-2.5 w-2.5 rounded-full ring-1 ring-border ring-offset-2 ring-offset-background transition-opacity hover:opacity-70"
                >
                  <span className={`h-full w-full rounded-full ${statusIncident ? incidentDotClasses(statusIncident.publicStatus) : 'bg-success'}`} />
                </Link>
              )}
            </div>
            <h1 className="m-0 text-[40px] font-semibold leading-[1.03] tracking-[-0.035em] text-foreground sm:text-[56px]">
              {app.name}
            </h1>
            {app.description && (
              <p className="mt-5 max-w-[520px] text-lg leading-[1.55] text-ink-muted sm:text-xl">{app.description}</p>
            )}
            {statusExplainer(app.status) && (
              <p className="mt-3 max-w-[520px] text-sm leading-[1.5] text-ink-faint">{statusExplainer(app.status)}</p>
            )}
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={actionHref(app)}
                target={app.status !== 'In Development' ? '_blank' : undefined}
                rel={app.status !== 'In Development' ? 'noopener noreferrer' : undefined}
                className="inline-flex items-center gap-1.5 rounded-[9px] bg-primary px-[26px] py-3.5 text-base font-semibold text-primary-foreground transition-colors hover:bg-accent-hover"
              >
                {actionLabel(app)} {app.status !== 'In Development' && <ArrowTopRightOnSquareIcon className="h-4 w-4" />}
              </Link>
              <Link
                href="/apps"
                className="inline-flex items-center gap-1.5 rounded-[9px] border border-border-strong px-[26px] py-3.5 text-base font-semibold text-foreground transition-colors hover:bg-muted"
              >
                All apps
              </Link>
            </div>
          </div>

          {meta.length > 0 && (
            <div className="w-full overflow-hidden rounded-xl border border-border">
              {meta.map((row) => (
                <div
                  key={row.k}
                  className="flex items-center justify-between gap-6 border-b border-border px-5 py-[15px] last:border-b-0"
                >
                  <span className="text-sm text-ink-faint">{row.k}</span>
                  <span className="font-mono text-[13px] text-ink-body">{row.v}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {features.length > 0 && (
          <div className="mt-[88px] grid grid-cols-1 gap-10 lg:grid-cols-[320px_1fr] lg:gap-20">
            <h2 className="m-0 text-[32px] font-semibold leading-[1.15] tracking-[-0.025em] text-foreground">
              What it does
            </h2>
            <div>
              {features.map((f, i) => (
                <div key={f} className="grid grid-cols-[48px_1fr] gap-6 border-t border-border py-[26px] first:border-t-0 first:pt-0">
                  <span className="pt-1 font-mono text-xs text-ink-disabled">{String(i + 1).padStart(2, '0')}</span>
                  <p className="m-0 max-w-[520px] text-base leading-[1.6] text-ink-muted">{f}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {shippedItems.length > 0 && (
          <div className="mt-[88px] grid grid-cols-1 gap-10 lg:grid-cols-[320px_1fr] lg:gap-20">
            <div>
              <h2 className="m-0 text-[32px] font-semibold leading-[1.15] tracking-[-0.025em] text-foreground">
                Recently shipped
              </h2>
              <Link
                href="/changelog"
                className="mt-4 inline-block border-b border-ink-disabled pb-0.5 text-[15px] font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
              >
                All {app.name} releases →
              </Link>
            </div>
            <div>
              {shippedItems.map((release) => (
                <div key={`${release.releasedDate}-${release.name}`} className="border-t border-border py-5 first:border-t-0 first:pt-0">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                    <span className="text-[17px] font-medium text-foreground">{release.name}</span>
                    <span className="font-mono text-xs text-ink-faint">{formatDate(release.releasedDate)}</span>
                  </div>
                  {release.description && (
                    <p className="m-0 mt-2 max-w-[520px] text-sm leading-[1.6] text-ink-muted">{release.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {roadmapItems.length > 0 && (
          <div className="mt-[88px] grid grid-cols-1 gap-10 lg:grid-cols-[320px_1fr] lg:gap-20">
            <div>
              <h2 className="m-0 text-[32px] font-semibold leading-[1.15] tracking-[-0.025em] text-foreground">
                On the roadmap
              </h2>
              <Link
                href="/roadmaps"
                className="mt-4 inline-block border-b border-ink-disabled pb-0.5 text-[15px] font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
              >
                All {app.name} items →
              </Link>
            </div>
            <div>
              {roadmapItems.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-[90px_1fr_auto] items-baseline gap-6 border-t border-border py-5 first:border-t-0 first:pt-0 sm:grid-cols-[110px_1fr_130px]"
                >
                  <span className="font-mono text-xs text-ink-faint">{formatRoadmapWhen(item)}</span>
                  <span className="text-[17px] font-medium text-foreground">{item.name}</span>
                  <span
                    className={`justify-self-start rounded-full px-2.5 py-1 text-xs font-semibold sm:justify-self-end ${roadmapStatusPillClasses(item.status)}`}
                  >
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
