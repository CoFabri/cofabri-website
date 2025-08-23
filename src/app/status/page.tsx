import { Metadata } from 'next';
import { getSystemStatus } from '@/lib/airtable';
import { StatusPageContent } from '@/components/ui/StatusPageContent';
import GradientHeading from '@/components/ui/GradientHeading';

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'System Status',
  description: 'Check the real-time status of all CoFabri services and applications. Monitor uptime, performance, and any ongoing issues.',
  keywords: ['system status', 'uptime', 'service status', 'monitoring', 'downtime', 'performance', 'availability'],
  openGraph: {
    title: 'System Status | CoFabri',
    description: 'Check the real-time status of all CoFabri services and applications.',
    url: 'https://cofabri.com/status',
    images: [
      {
        url: '/images/placeholder.jpg',
        width: 1200,
        height: 630,
        alt: 'CoFabri System Status',
      },
    ],
  },
  twitter: {
    title: 'System Status | CoFabri',
    description: 'Check the real-time status of all CoFabri services and applications.',
  },
  alternates: {
    canonical: '/status',
  },
};

export default async function StatusPage() {
  const statuses = await getSystemStatus();

  return <StatusPageContent initialStatuses={statuses} />;
} 