// src/app/developers/[appId]/page.tsx
//
// Central, rendered API reference for one CoFabri app -- fetches that app's
// own /openapi.json live (server-side, revalidated every 5 minutes) and
// renders it here rather than just linking out. The spec itself stays
// generated from real route code in that app's own repo (see e.g.
// rx-bridge's lib/openapi/build-spec.ts); this page never stores a copy.
//
// Public, not gated behind the central developer-portal sign-in: the spec
// this renders is itself served unauthenticated at the app's own domain
// (that's the whole point -- "publicly readable, no auth required"), so
// gating the rendered version here would be a real regression versus an
// app's previous, already-public docs page.
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getApp } from '@/lib/api-client';
import { fetchAppSpec } from '@/lib/developer-portal/fetch-app-spec';
import { flattenEndpoints, groupByTag } from '@/lib/developer-portal/openapi-types';
import { getAppGuide } from '@/lib/developer-portal/guides';
import { AppMonogram } from '@/components/developer-portal/AppMonogram';
import { DocsSidebar } from '@/components/developer-portal/docs/DocsSidebar';
import { UseWithAiButton } from '@/components/developer-portal/docs/UseWithAiButton';
import { AiPanel } from '@/components/developer-portal/docs/AiPanel';
import { GuideBlockView } from '@/components/developer-portal/docs/GuideBlockView';
import { EndpointCard, endpointSlug } from '@/components/developer-portal/docs/EndpointCard';

interface AppDocsPageProps {
  params: Promise<{ appId: string }>;
}

export async function generateMetadata({ params }: AppDocsPageProps): Promise<Metadata> {
  const { appId } = await params;
  const app = await getApp(appId);
  if (!app) return { title: 'API Reference' };
  return {
    title: `${app.name} API reference`,
    description: `Machine-readable API reference for ${app.name}, generated from its live OpenAPI spec.`,
    alternates: { canonical: `/developers/${appId}` },
  };
}

function tagAnchor(tag: string): string {
  return `tag-${tag.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}

export default async function AppDocsPage({ params }: AppDocsPageProps) {
  const { appId } = await params;
  const app = await getApp(appId);
  if (!app) notFound();

  const specResult = await fetchAppSpec(app.url);
  const guide = getAppGuide(appId);

  if (!specResult.ok) {
    return (
      <div className="mx-auto max-w-[640px] px-6 py-24 text-center">
        <Link href="/developers" className="text-sm font-medium text-accent-solid hover:text-accent-hover">
          ← All CoFabri APIs
        </Link>
        <h1 className="mt-6 text-[28px] font-semibold tracking-tight">{app.name} doesn&apos;t publish a machine-readable spec yet</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
          This page renders an app&apos;s API reference straight from its own <code className="font-mono text-[13px]">/openapi.json</code>.{' '}
          {app.name} hasn&apos;t published one at its own domain yet.
        </p>
      </div>
    );
  }

  const { spec, specUrl, llmsTxtUrl } = specResult;
  const endpoints = flattenEndpoints(spec);
  const groups = groupByTag(endpoints);
  const baseUrl = spec.servers?.[0]?.url;

  return (
    <div className="min-h-screen bg-background">
      <div className="h-[3px] bg-accent-solid" />
      <header className="flex h-[60px] items-center justify-between gap-6 border-b border-border px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/developers" className="text-sm text-muted-foreground hover:text-foreground">
            ← Developers
          </Link>
          <span className="text-border-strong">/</span>
          <AppMonogram appId={app.id} appName={app.name} faviconUrl={app.faviconUrl} size={22} />
          <span className="truncate text-[14px] font-medium text-foreground">{app.name}</span>
          <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-[12px] text-muted-foreground">v{spec.info.version}</span>
        </div>
        <div className="flex flex-none items-center gap-2">
          <UseWithAiButton appName={app.name} specUrl={specUrl} llmsTxtUrl={llmsTxtUrl} />
        </div>
      </header>

      <div className="mx-auto flex max-w-[1320px]">
        <DocsSidebar guide={guide} groups={groups} />

        <main className="min-w-0 flex-1 px-6 py-10 lg:px-10">
          <div id="overview" className="scroll-mt-24">
            <div className="flex items-center gap-3">
              <AppMonogram appId={app.id} appName={app.name} faviconUrl={app.faviconUrl} size={40} />
              <div className="font-mono text-[12px] uppercase tracking-wide text-muted-foreground">{app.name} · REST API</div>
            </div>
            <h1 className="mt-3 text-[36px] font-semibold leading-tight tracking-tight">{spec.info.title}</h1>
            {spec.info.description ? (
              <p className="mt-4 max-w-[640px] text-[17px] leading-relaxed text-muted-foreground">{spec.info.description}</p>
            ) : null}
            {guide?.intro ? <p className="mt-3 max-w-[640px] text-[15px] leading-relaxed text-muted-foreground">{guide.intro}</p> : null}

            {baseUrl ? (
              <div className="mt-6 flex items-center gap-3 rounded-lg border border-border bg-surface-sunken px-3.5 py-2.5">
                <span className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">Base URL</span>
                <span className="font-mono text-[13px] text-foreground">{baseUrl}</span>
              </div>
            ) : null}
          </div>

          {guide
            ? guide.sections.map((section) => (
                <div key={section.id} id={section.id} className="mt-12 scroll-mt-24">
                  <h2 className="text-[22px] font-semibold tracking-tight">{section.title}</h2>
                  {section.blocks.map((block, i) => (
                    <GuideBlockView key={i} block={block} />
                  ))}
                </div>
              ))
            : null}

          {groups.map((group) => (
            <div key={group.tag} id={tagAnchor(group.tag)} className="mt-14 scroll-mt-24">
              <div className="flex items-baseline gap-3">
                <h2 className="text-[22px] font-semibold tracking-tight">{group.tag}</h2>
                <span className="font-mono text-[12px] text-muted-foreground">
                  {group.endpoints.length} endpoint{group.endpoints.length === 1 ? '' : 's'}
                </span>
              </div>
              <div className="mt-4 flex flex-col gap-3">
                {group.endpoints.map((e) => (
                  <EndpointCard key={endpointSlug(e)} endpoint={e} />
                ))}
              </div>
            </div>
          ))}
        </main>

        <aside className="hidden shrink-0 border-l border-border py-8 pl-5 xl:block xl:w-[280px]">
          <AiPanel specUrl={specUrl} llmsTxtUrl={llmsTxtUrl} />
        </aside>
      </div>
    </div>
  );
}
