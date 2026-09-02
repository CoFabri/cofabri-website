'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import GradientHeading from '@/components/marketing/GradientHeading';

export default function NotFound() {
  const pathname = usePathname();
  const isKnowledgeBaseArticle = pathname?.startsWith('/knowledge-base/');

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <h1 className="text-9xl font-bold text-muted">404</h1>
          </div>
          
          <GradientHeading
            title="Page Not Found"
            subtitle={
              isKnowledgeBaseArticle 
                ? "The knowledge base article you're looking for doesn't exist or may have been moved."
                : "The page you're looking for doesn't exist or may have been moved."
            }
          />

          <div className="mt-8 space-y-4">
            {isKnowledgeBaseArticle ? (
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  The article &quot;{pathname?.replace('/knowledge-base/', '')}&quot; could not be found.
                  It may have been removed, renamed, or never existed.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/knowledge-base"
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-primary-foreground bg-primary hover:bg-accent-hover transition-colors duration-200"
                  >
                    Browse Knowledge Base
                  </Link>
                  <Link
                    href="/"
                    className="inline-flex items-center px-6 py-3 border border-border text-base font-medium rounded-md text-foreground bg-card hover:bg-muted transition-colors duration-200"
                  >
                    Go Home
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  The page you&apos;re looking for could not be found.
                  It may have been moved, deleted, or the URL may be incorrect.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/"
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-primary-foreground bg-primary hover:bg-accent-hover transition-colors duration-200"
                  >
                    Go Home
                  </Link>
                  <Link
                    href="/contact"
                    className="inline-flex items-center px-6 py-3 border border-border text-base font-medium rounded-md text-foreground bg-card hover:bg-muted transition-colors duration-200"
                  >
                    Contact Support
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Helpful links */}
          <div className="mt-12 pt-8 border-t border-border">
            <h3 className="text-lg font-semibold text-foreground mb-4">Helpful Links</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <Link href="/knowledge-base" className="text-primary hover:text-accent-hover">
                Knowledge Base
              </Link>
              <Link href="/apps" className="text-primary hover:text-accent-hover">
                Our Apps
              </Link>
              <Link href="/contact" className="text-primary hover:text-accent-hover">
                Contact Us
              </Link>
              <Link href="/support" className="text-primary hover:text-accent-hover">
                Support
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
