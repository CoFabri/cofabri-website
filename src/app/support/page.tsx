import { Suspense } from 'react';
import SupportPageContent from './SupportPageContent';

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

export default function SupportPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 mt-16">
          <div className="max-w-6xl mx-auto">
            <div className="animate-pulse">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-center mb-4">
                      <div className="h-6 w-6 bg-gray-200 rounded mr-3"></div>
                      <div className="h-5 w-32 bg-gray-200 rounded"></div>
                    </div>
                    <div className="h-4 w-full bg-gray-200 rounded mb-4"></div>
                    <div className="h-4 w-24 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
                <div className="flex items-center mb-4">
                  <div className="h-6 w-6 bg-gray-200 rounded mr-3"></div>
                  <div className="h-5 w-32 bg-gray-200 rounded"></div>
                </div>
                <div className="h-4 w-full bg-gray-200 rounded"></div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="h-[1600px] bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    }>
      <SupportPageContent />
    </Suspense>
  );
} 