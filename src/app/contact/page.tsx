import { Suspense } from 'react';
import { Metadata } from 'next';
import { CoreLoader } from '@/components/ui/core-loader';
import Contact from '@/components/marketing/Contact';
import Breadcrumbs from '@/components/marketing/Breadcrumbs';
import PageHero from '@/components/marketing/PageHero';
import RevealSection from '@/components/marketing/RevealSection';

export const metadata: Metadata = {
  title: 'Contact',
  description: "Sales questions, partnerships, or anything that doesn't fit a support ticket. We reply within one business day.",
  keywords: ['contact', 'sales', 'partnerships', 'get in touch'],
  alternates: {
    canonical: '/contact',
  },
  openGraph: {
    title: 'Contact | CoFabri',
    description: "Sales questions, partnerships, or anything that doesn't fit a support ticket.",
    url: 'https://cofabri.com/contact',
  },
  twitter: {
    title: 'Contact | CoFabri',
    description: "Sales questions, partnerships, or anything that doesn't fit a support ticket.",
  },
};

function ContactPageContent() {
  return (
    <div className="mx-auto max-w-[1200px] px-6 pt-9 pb-24 sm:px-10">
      <div className="mb-14">
        <Breadcrumbs items={[{ name: 'Contact', href: '/contact' }]} />
      </div>

      <PageHero
        eyebrow="Contact"
        title="Say hello."
        subtitle="Sales questions, partnerships, or something that doesn't fit a support ticket."
      />

      <RevealSection className="mt-14">
        <Contact />
      </RevealSection>
    </div>
  );
}

export default function ContactPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <CoreLoader size={52} />
        </div>
      }
    >
      <ContactPageContent />
    </Suspense>
  );
}
