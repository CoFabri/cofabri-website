import { Metadata } from 'next';
import { getSystemStatus, getServiceUptimeHistory } from '@/lib/airtable';
import { getApps } from '@/lib/api-client';
import { StatusPageContent } from '@/components/marketing/StatusPageContent';

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Status',
  description: 'Live status for every CoFabri service. Updated automatically, and by a human when something needs saying.',
  keywords: ['system status', 'uptime', 'service status', 'monitoring', 'downtime', 'incidents'],
  openGraph: {
    title: 'Status | CoFabri',
    description: 'Live status for every CoFabri service. Updated automatically, and by a human when something needs saying.',
    url: 'https://cofabri.com/status',
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
    title: 'Status | CoFabri',
    description: 'Live status for every CoFabri service. Updated automatically, and by a human when something needs saying.',
    images: ['https://files.cofabri.com/logos/cofabri/cofabri-og-image.png'],
  },
  alternates: {
    canonical: '/status',
  },
};

export default async function StatusPage() {
  const [statuses, apps, uptimeHistory] = await Promise.all([getSystemStatus(), getApps(), getServiceUptimeHistory()]);

  return <StatusPageContent initialStatuses={statuses} apps={apps} uptimeHistory={uptimeHistory} />;
}
