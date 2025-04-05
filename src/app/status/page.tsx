import { getSystemStatus } from '@/lib/airtable';
import { StatusPageContent } from '@/components/ui/StatusPageContent';

export default async function StatusPage() {
  const statuses = await getSystemStatus();

  return <StatusPageContent initialStatuses={statuses} />;
} 