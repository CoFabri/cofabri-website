import { Suspense } from 'react';
import Contact from '@/components/ui/Contact';
import GradientHeading from '@/components/ui/GradientHeading';
import Breadcrumbs from '@/components/ui/Breadcrumbs';

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

function ContactPageContent() {
  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 pt-8">
        <Breadcrumbs items={[{ name: 'Contact', href: '/contact' }]} />
      </div>
      <GradientHeading
        title="Contact Us"
        subtitle="Get in touch with our team for any questions or support"
      />
      <Contact />
    </div>
  );
}

export default function ContactPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen">
        <GradientHeading
          title="Contact Us"
          subtitle="Get in touch with our team for any questions or support"
        />
        <div className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto space-y-8">
              <div className="bg-white rounded-3xl p-8 shadow-sm">
                <div className="animate-pulse">
                  <div className="h-8 w-48 bg-gray-200 rounded mb-8"></div>
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gray-200"></div>
                      <div className="flex-1">
                        <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
                        <div className="space-y-2">
                          <div className="h-3 w-48 bg-gray-200 rounded"></div>
                          <div className="h-3 w-40 bg-gray-200 rounded"></div>
                          <div className="h-3 w-24 bg-gray-200 rounded"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-3xl p-8 shadow-sm">
                <div className="animate-pulse">
                  <div className="h-[1150px] bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    }>
      <ContactPageContent />
    </Suspense>
  );
} 