import Link from 'next/link';
import StructuredData from './StructuredData';

interface BreadcrumbItem {
  name: string;
  href: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  const breadcrumbItems = [
    { name: 'Home', href: '/' },
    ...items
  ];

  const structuredData = {
    items: breadcrumbItems.map(item => ({
      name: item.name,
      url: `https://cofabri.com${item.href}`
    }))
  };

  return (
    <>
      <StructuredData type="breadcrumb" data={structuredData} />
      <nav className={`flex items-center gap-2.5 text-sm ${className}`} aria-label="Breadcrumb">
        {breadcrumbItems.map((item, index) => (
          <div key={item.href} className="flex items-center gap-2.5">
            {index > 0 && <span className="text-ink-disabled">/</span>}
            {index === breadcrumbItems.length - 1 ? (
              <span className="font-medium text-foreground" aria-current="page">
                {item.name}
              </span>
            ) : (
              <Link href={item.href} className="text-ink-faint transition-colors hover:text-foreground">
                {item.name}
              </Link>
            )}
          </div>
        ))}
      </nav>
    </>
  );
}
