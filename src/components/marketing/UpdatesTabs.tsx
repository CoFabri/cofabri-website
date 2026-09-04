import Link from 'next/link';
import { filterPillClasses } from '@/lib/filter-pill';

const TABS = [
  { key: 'roadmap', label: 'Roadmap', href: '/roadmaps' },
  { key: 'changelog', label: 'Changelog', href: '/changelog' },
] as const;

export default function UpdatesTabs({ active }: { active: 'roadmap' | 'changelog' }) {
  return (
    <div className="mb-8 flex gap-2">
      {TABS.map((tab) => (
        <Link key={tab.key} href={tab.href} className={filterPillClasses(tab.key === active)}>
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
