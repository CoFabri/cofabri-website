'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { CoreLoader } from '@/components/ui/core-loader';
import { KnowledgeBaseArticle } from '@/lib/api-client';
import { filterPillClasses } from '@/lib/filter-pill';
import Breadcrumbs from '@/components/marketing/Breadcrumbs';
import PageHero from '@/components/marketing/PageHero';
import RevealSection from '@/components/marketing/RevealSection';
import StructuredData from '@/components/marketing/StructuredData';
import { EmptyState } from '@/components/marketing/EmptyState';
import { ErrorState } from '@/components/marketing/ErrorState';
import { Pagination } from '@/components/marketing/Pagination';

const ARTICLES_PER_PAGE = 6;

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

interface KnowledgeBaseContentProps {
  initialArticles: KnowledgeBaseArticle[];
}

export default function KnowledgeBaseContent({ initialArticles }: KnowledgeBaseContentProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [articles, setArticles] = useState<KnowledgeBaseArticle[]>(initialArticles);
  // Server already fetched this page's data (see knowledge-base/page.tsx) so
  // the initial HTML has real content for crawlers — this only stays "loading"
  // if that server fetch came back empty, as a client-side recovery path.
  const [isLoading, setIsLoading] = useState(initialArticles.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Initialize from URL parameters
  useEffect(() => {
    if (!searchParams) return;
    const categoryParam = searchParams.get('category');
    const searchParam = searchParams.get('search');
    if (categoryParam) setSelectedCategory(categoryParam);
    if (searchParam) setSearchQuery(searchParam);
  }, [searchParams]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/knowledge-base', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch knowledge base articles');
      setArticles((await response.json()) as KnowledgeBaseArticle[]);
    } catch (err) {
      console.error('Error loading knowledge base articles:', err);
      setError(err instanceof Error ? err.message : 'Failed to load knowledge base articles');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const categories = useMemo(() => Array.from(new Set(articles.map((a) => a.category))), [articles]);

  const filteredArticles = useMemo(
    () =>
      articles.filter((article) => {
        const q = searchQuery.trim().toLowerCase();
        const matchesSearch =
          !q ||
          article.title.toLowerCase().includes(q) ||
          (article.excerpt || '').toLowerCase().includes(q) ||
          (article.content || '').toLowerCase().includes(q);
        const matchesCategory = !selectedCategory || article.category === selectedCategory;
        return matchesSearch && matchesCategory;
      }),
    [articles, searchQuery, selectedCategory]
  );

  const totalPages = Math.max(1, Math.ceil(filteredArticles.length / ARTICLES_PER_PAGE));
  const paginatedArticles = filteredArticles.slice(
    (currentPage - 1) * ARTICLES_PER_PAGE,
    currentPage * ARTICLES_PER_PAGE
  );

  const updateURL = (newCategory?: string, newSearch?: string) => {
    const params = new URLSearchParams();
    if (newCategory) params.set('category', newCategory);
    if (newSearch) params.set('search', newSearch);
    const queryString = params.toString();
    router.push(queryString ? `${pathname || ''}?${queryString}` : pathname || '');
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
    updateURL(category || undefined, searchQuery || undefined);
  };

  const handleSearchChange = (search: string) => {
    setSearchQuery(search);
    setCurrentPage(1);
    updateURL(selectedCategory || undefined, search || undefined);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setCurrentPage(1);
    updateURL(undefined, undefined);
  };

  return (
    <div className="mx-auto max-w-[1200px] px-6 pt-9 pb-24 sm:px-10">
      {articles.length > 0 && (
        <StructuredData
          type="itemList"
          data={{ items: articles.map((a) => ({ name: a.title, url: `https://cofabri.com/knowledge-base/${a.slug}` })) }}
        />
      )}
      <div className="mb-14">
        <Breadcrumbs items={[{ name: 'Knowledge base', href: '/knowledge-base' }]} />
      </div>

      <PageHero
        eyebrow="Knowledge base"
        title="How things work."
        subtitle="Setup guides, troubleshooting, and the answers support gives most often."
        right={
          <div className="relative w-full sm:w-[400px]">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-faint" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={`Search ${articles.length || ''} articles`.trim()}
              className="h-14 w-full rounded-[10px] border border-border-strong bg-background pl-12 pr-4 text-[17px] text-foreground placeholder:text-ink-faint focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
            />
          </div>
        }
      />

      {categories.length > 0 && (
        <div className="mt-10 flex flex-wrap gap-2 border-b border-border pb-9">
          <button
            type="button"
            onClick={() => handleCategoryChange('')}
            className={filterPillClasses(selectedCategory === '')}
          >
            All categories
          </button>
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => handleCategoryChange(category)}
              className={filterPillClasses(selectedCategory === category)}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      <RevealSection>
      {isLoading ? (
        <div className="mt-16 flex justify-center">
          <CoreLoader size={40} />
        </div>
      ) : error ? (
        <div className="mt-16">
          <ErrorState title="Couldn't load the knowledge base" description={error} onRetry={fetchData} />
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="mt-16">
          <EmptyState
            icon={<MagnifyingGlassIcon className="h-5 w-5" />}
            title="No articles match"
            description="Try a different search term, or clear the category filter."
            action={{ label: 'Clear Filters', onClick: clearFilters }}
          />
        </div>
      ) : (
        <>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {paginatedArticles.map((article) => (
              <Link
                key={article.id}
                href={`/knowledge-base/${article.slug}`}
                className="block rounded-xl border border-border p-6 text-foreground transition-all duration-200 hover:-translate-y-px hover:border-ink-disabled"
              >
                <div className="flex items-center gap-2.5">
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
                  <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-faint">
                    {article.category}
                  </span>
                </div>
                <h3 className="m-0 mt-2.5 text-lg font-semibold leading-[1.35] tracking-[-0.015em] text-foreground">
                  {article.title}
                </h3>
                {article.excerpt && (
                  <p className="mt-2 line-clamp-3 text-[15px] leading-[1.55] text-ink-muted">{article.excerpt}</p>
                )}
                <div className="mt-4 flex gap-3.5 font-mono text-[11px] text-ink-disabled">
                  {article.readTime > 0 && <span>{article.readTime} min read</span>}
                  {article.lastUpdated && <span>{formatDate(article.lastUpdated)}</span>}
                </div>
              </Link>
            ))}
          </div>

          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </>
      )}
      </RevealSection>
    </div>
  );
}
