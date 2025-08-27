import Link from 'next/link';
import { usePathname } from 'next/navigation';
import GradientHeading from '@/components/ui/GradientHeading';

export default function NotFound() {
  const pathname = usePathname();
  const isKnowledgeBaseArticle = pathname?.startsWith('/knowledge-base/');

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <h1 className="text-9xl font-bold text-gray-200">404</h1>
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
                <p className="text-gray-600">
                  The article "{pathname?.replace('/knowledge-base/', '')}" could not be found. 
                  It may have been removed, renamed, or never existed.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/knowledge-base"
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
                  >
                    Browse Knowledge Base
                  </Link>
                  <Link
                    href="/"
                    className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
                  >
                    Go Home
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-gray-600">
                  The page you're looking for could not be found. 
                  It may have been moved, deleted, or the URL may be incorrect.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/"
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
                  >
                    Go Home
                  </Link>
                  <Link
                    href="/contact"
                    className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
                  >
                    Contact Support
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Helpful links */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Helpful Links</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <Link href="/knowledge-base" className="text-blue-600 hover:text-blue-800">
                Knowledge Base
              </Link>
              <Link href="/apps" className="text-blue-600 hover:text-blue-800">
                Our Apps
              </Link>
              <Link href="/contact" className="text-blue-600 hover:text-blue-800">
                Contact Us
              </Link>
              <Link href="/support" className="text-blue-600 hover:text-blue-800">
                Support
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
