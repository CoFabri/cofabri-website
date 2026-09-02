import { Suspense } from 'react';
import { Metadata } from 'next';
import SignupPageContent from './SignupPageContent';

// This is a per-app waitlist funnel reached via ?appId=, not a page anyone
// searches for directly — its content is thin and duplicates across every
// appId variant, so it's excluded from search rather than indexed.
export const metadata: Metadata = {
  title: 'Join the Waitlist',
  robots: {
    index: false,
    follow: true,
  },
};

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-foreground mb-4">Loading...</h1>
        </div>
      </div>
    }>
      <SignupPageContent />
    </Suspense>
  );
}
