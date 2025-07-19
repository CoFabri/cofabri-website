import { getSystemStatus } from '@/lib/airtable';
import { StatusPageContent } from '@/components/ui/StatusPageContent';
import GradientHeading from '@/components/ui/GradientHeading';

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

export default async function StatusPage() {
  const statuses = await getSystemStatus();

  return <StatusPageContent initialStatuses={statuses} />;
} 