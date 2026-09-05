import { getKnowledgeBaseArticle, getKnowledgeBaseArticlesBySlugs } from '@/lib/api-client';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Metadata } from 'next';
import { marked } from 'marked';
import Breadcrumbs from '@/components/marketing/Breadcrumbs';
import { Twitter, Linkedin } from 'lucide-react';

marked.setOptions({
  breaks: true,
  gfm: true,
});

interface KnowledgeBaseArticlePageProps {
  params: Promise<{ slug: string }>;
}

function formatDate(value?: string): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export async function generateMetadata({ params }: KnowledgeBaseArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getKnowledgeBaseArticle(slug);

  if (!article) {
    return {
      title: 'Article Not Found | Knowledge Base',
      description: 'The requested article could not be found.',
    };
  }

  const description = article.excerpt || article.content.slice(0, 160);

  return {
    title: `${article.title} | Knowledge Base`,
    description,
    alternates: {
      canonical: `https://cofabri.com/knowledge-base/${slug}`,
    },
    openGraph: {
      title: article.title,
      description,
      type: 'article',
      publishedTime: article.publishedAt,
      modifiedTime: article.lastUpdated,
      authors: article.author ? [article.author] : undefined,
      tags: article.tags,
      url: `https://cofabri.com/knowledge-base/${slug}`,
      images: [
        {
          url: 'https://files.cofabri.com/logos/cofabri/cofabri-og-image.png',
          width: 1200,
          height: 630,
          alt: 'CoFabri',
        },
      ],
    },
    twitter: {
      title: article.title,
      description,
      images: ['https://files.cofabri.com/logos/cofabri/cofabri-og-image.png'],
    },
    other: {
      'article:published_time': article.publishedAt,
      'article:modified_time': article.lastUpdated || article.publishedAt,
    },
  };
}

export default async function KnowledgeBaseArticlePage({ params }: KnowledgeBaseArticlePageProps) {
  const { slug } = await params;
  const article = await getKnowledgeBaseArticle(slug);

  if (!article) {
    notFound();
  }

  const htmlContent = article.content ? await marked(article.content) : '';

  let relatedArticles = await (async () => {
    if (!article.relatedTopics) return [];

    const topicSlugs = Array.isArray(article.relatedTopics)
      ? article.relatedTopics
      : article.relatedTopics.split(',').map((s) => s.trim()).filter(Boolean);

    const validSlugs = topicSlugs.filter((s) => /^[a-z0-9-]+$/.test(s));
    if (validSlugs.length === 0) return [];

    return getKnowledgeBaseArticlesBySlugs(validSlugs);
  })();
  relatedArticles = relatedArticles.filter((a) => a.slug !== article.slug);

  const singleApp = article.applications.length === 1 ? article.applications[0] : null;
  const applicationNames = article.applications.map((a) => a.name);

  const meta = (
    [
      { k: 'Category', v: article.category },
      {
        k: 'Application',
        v: singleApp ? singleApp.name : applicationNames.length > 0 ? applicationNames.join(', ') : undefined,
        node: singleApp ? (
          singleApp.appUrl ? (
            <a
              href={singleApp.appUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 font-mono text-[13px] text-ink-body transition-colors hover:text-foreground"
            >
              {singleApp.faviconUrl && (
                <div className="relative h-5 w-5 flex-shrink-0 overflow-hidden rounded-md border border-border bg-white p-0.5">
                  <Image src={singleApp.faviconUrl} alt="" fill className="object-contain" unoptimized={process.env.NODE_ENV === 'development'} />
                </div>
              )}
              {singleApp.name}
            </a>
          ) : (
            <span className="flex items-center gap-1.5 font-mono text-[13px] text-ink-body">
              {singleApp.faviconUrl && (
                <div className="relative h-5 w-5 flex-shrink-0 overflow-hidden rounded-md border border-border bg-white p-0.5">
                  <Image src={singleApp.faviconUrl} alt="" fill className="object-contain" unoptimized={process.env.NODE_ENV === 'development'} />
                </div>
              )}
              {singleApp.name}
            </span>
          )
        ) : undefined,
      },
      { k: 'Author', v: article.authorProfile ? undefined : article.author || undefined },
      { k: 'Published', v: formatDate(article.publishedAt) },
      { k: 'Last updated', v: formatDate(article.lastUpdated) },
      { k: 'Read time', v: article.readTime > 0 ? `${article.readTime} min` : undefined },
    ] as { k: string; v: string | undefined; node?: React.ReactNode }[]
  ).filter((row): row is { k: string; v: string; node?: React.ReactNode } => !!row.v);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1200px] px-6 pt-9 pb-24 sm:px-10">
        <div className="mb-14">
          <Breadcrumbs
            items={[
              { name: 'Knowledge base', href: '/knowledge-base' },
              { name: article.title, href: `/knowledge-base/${article.slug}` },
            ]}
          />
        </div>

        <div className="grid grid-cols-1 items-start gap-14 lg:grid-cols-[1fr_360px] lg:gap-20">
          <div>
            <div className="mb-5 flex flex-wrap items-center gap-2.5">
              {article.logoUrl && (
                <Image
                  src={article.logoUrl}
                  alt=""
                  width={64}
                  height={20}
                  className="h-5 w-auto max-w-[64px] flex-shrink-0 object-contain"
                  unoptimized={process.env.NODE_ENV === 'development'}
                />
              )}
              <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-faint">
                {article.category}
              </span>
            </div>

            <h1 className="m-0 text-[32px] font-semibold leading-[1.15] tracking-[-0.02em] text-foreground sm:text-[44px]">
              {article.title}
            </h1>

            {article.excerpt && (
              <p className="mt-5 max-w-[640px] text-lg leading-[1.55] text-ink-muted sm:text-xl">{article.excerpt}</p>
            )}

            {article.tags && article.tags.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {article.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-border px-2.5 py-1 text-xs font-medium text-ink-body"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {article.authorProfile && (
              <div className="group mt-8 flex items-center gap-4">
                {article.authorProfile.headshotUrl ? (
                  <Image
                    src={article.authorProfile.headshotUrl}
                    alt={article.authorProfile.name}
                    width={56}
                    height={56}
                    className="hover-image-avatar h-14 w-14 flex-shrink-0 rounded-full object-cover"
                    unoptimized={process.env.NODE_ENV === 'development'}
                  />
                ) : (
                  <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-surface-raised text-lg font-semibold text-ink-faint">
                    {article.authorProfile.name.charAt(0)}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{article.authorProfile.name}</p>
                  {article.authorProfile.role && (
                    <p className="text-xs text-ink-faint">{article.authorProfile.role}</p>
                  )}
                  {article.authorProfile.bio && (
                    <p className="mt-1 max-w-[480px] text-xs leading-relaxed text-ink-muted">
                      {article.authorProfile.bio}
                    </p>
                  )}
                  {(article.authorProfile.twitterUrl || article.authorProfile.linkedinUrl) && (
                    <div className="mt-1.5 flex items-center gap-3">
                      {article.authorProfile.twitterUrl && (
                        <a
                          href={article.authorProfile.twitterUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-ink-faint transition-colors hover:text-foreground"
                        >
                          <Twitter className="h-4 w-4" />
                        </a>
                      )}
                      {article.authorProfile.linkedinUrl && (
                        <a
                          href={article.authorProfile.linkedinUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-ink-faint transition-colors hover:text-foreground"
                        >
                          <Linkedin className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {meta.length > 0 && (
            <div className="w-full overflow-hidden rounded-xl border border-border">
              {meta.map((row) => (
                <div
                  key={row.k}
                  className="flex items-center justify-between gap-6 border-b border-border px-5 py-[15px] last:border-b-0"
                >
                  <span className="text-sm text-ink-faint">{row.k}</span>
                  {row.node ?? <span className="font-mono text-[13px] text-ink-body">{row.v}</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-14 max-w-[720px] border-t border-border pt-14">
          {htmlContent ? (
            <div
              className="markdown-content text-[17px] leading-[1.7] text-foreground"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          ) : (
            <p className="text-[17px] leading-[1.7] text-ink-muted">{article.excerpt || 'Content not available.'}</p>
          )}
        </div>

        {relatedArticles.length > 0 && (
          <div className="mt-[88px] border-t border-border pt-14">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="m-0 text-[32px] font-semibold leading-[1.15] tracking-[-0.025em] text-foreground">
                Related articles
              </h2>
              <Link
                href="/knowledge-base"
                className="border-b border-ink-disabled pb-0.5 text-[15px] font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
              >
                All articles →
              </Link>
            </div>
            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedArticles.map((related) => (
                <Link
                  key={related.id}
                  href={`/knowledge-base/${related.slug}`}
                  className="block rounded-xl border border-border p-6 text-foreground transition-all hover:-translate-y-px hover:border-ink-disabled"
                >
                  <div className="flex items-center gap-2.5">
                    {related.logoUrl && (
                      <Image
                        src={related.logoUrl}
                        alt=""
                        width={64}
                        height={20}
                        className="h-5 w-auto max-w-[64px] flex-shrink-0 object-contain"
                        unoptimized={process.env.NODE_ENV === 'development'}
                      />
                    )}
                    <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-faint">
                      {related.category}
                    </span>
                  </div>
                  <h3 className="m-0 mt-2.5 text-lg font-semibold leading-[1.35] tracking-[-0.015em] text-foreground">
                    {related.title}
                  </h3>
                  {related.excerpt && (
                    <p className="mt-2 line-clamp-3 text-[15px] leading-[1.55] text-ink-muted">{related.excerpt}</p>
                  )}
                  <div className="mt-4 flex gap-3.5 font-mono text-[11px] text-ink-disabled">
                    {related.readTime > 0 && <span>{related.readTime} min read</span>}
                    {related.lastUpdated && <span>{formatDate(related.lastUpdated)}</span>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
