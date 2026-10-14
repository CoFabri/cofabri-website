import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getApps, getPolicy } from '@/lib/api-client';
import { renderPolicyHtml } from '@/lib/policy-markdown';
import Breadcrumbs from '@/components/marketing/Breadcrumbs';

export const revalidate = 300;

interface LegalDocumentPageProps {
  params: Promise<{ slug: string }>;
}

function formatLongDate(value?: string): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

export async function generateMetadata({ params }: LegalDocumentPageProps): Promise<Metadata> {
  const { slug } = await params;
  const policy = await getPolicy(slug);

  if (!policy) {
    return {
      title: 'Document Not Found | Legal',
      description: 'The requested document could not be found.',
    };
  }

  const description = `${policy.title}, version ${policy.versionNumber}.`;
  return {
    title: `${policy.title} | Legal`,
    description,
    alternates: { canonical: `https://cofabri.com/legal/${slug}` },
    openGraph: { title: policy.title, description, url: `https://cofabri.com/legal/${slug}` },
  };
}

export default async function LegalDocumentPage({ params }: LegalDocumentPageProps) {
  const { slug } = await params;
  const policy = await getPolicy(slug);

  if (!policy) {
    notFound();
  }

  const apps = await getApps().catch(() => []);
  const names = Object.fromEntries(apps.map((a) => [a.id, a.name]));
  const html = renderPolicyHtml(policy.body);
  const effective = formatLongDate(policy.publishedAt);
  const appliesTo = policy.apps.map((id) => names[id] ?? id).join(', ');

  const meta = [
    { k: 'Applies To', v: appliesTo || undefined },
    { k: 'Version', v: String(policy.versionNumber) },
    { k: 'Effective', v: effective },
  ].filter((row): row is { k: string; v: string } => !!row.v);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1200px] px-6 pt-9 pb-24 sm:px-10">
        <div className="mb-14">
          <Breadcrumbs
            items={[
              { name: 'Legal', href: '/legal' },
              { name: policy.title, href: `/legal/${slug}` },
            ]}
          />
        </div>

        <div className="grid grid-cols-1 items-start gap-14 lg:grid-cols-[1fr_360px] lg:gap-20">
          <div>
            <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-faint">Legal</span>
            <h1 className="m-0 mt-5 text-[32px] font-semibold leading-[1.15] tracking-[-0.02em] text-foreground sm:text-[44px]">
              {policy.title}
            </h1>
          </div>

          <dl className="m-0 w-full overflow-hidden rounded-xl border border-border">
            {meta.map((row) => (
              <div
                key={row.k}
                className="flex items-center justify-between gap-6 border-b border-border px-5 py-[15px] last:border-b-0"
              >
                <dt className="text-sm text-ink-faint">{row.k}</dt>
                <dd className="m-0 text-right font-mono text-[13px] text-ink-body">{row.v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="mt-14 max-w-[720px] border-t border-border pt-14">
          {html ? (
            <div
              className="markdown-content text-[17px] leading-[1.7] text-foreground"
              // Safe: the HTML is sanitised by renderPolicyHtml (raw HTML escaped, unsafe links dropped).
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ) : (
            <p className="text-[17px] leading-[1.7] text-ink-muted">This document has no content yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
