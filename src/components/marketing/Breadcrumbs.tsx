import Link from 'next/link';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';
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
      <nav className={`flex items-center space-x-2 text-sm text-muted-foreground ${className}`} aria-label="Breadcrumb">
        {breadcrumbItems.map((item, index) => (
          <div key={item.href} className="flex items-center">
            {index > 0 && (
              <ChevronRightIcon className="h-4 w-4 text-ink-faint mx-2" />
            )}
            {index === breadcrumbItems.length - 1 ? (
              <span className="text-foreground font-medium" aria-current="page">
                {index === 0 ? (
                  <HomeIcon className="h-4 w-4" />
                ) : (
                  item.name
                )}
              </span>
            ) : (
              <Link
                href={item.href}
                className="hover:text-primary transition-colors duration-200 flex items-center"
              >
                {index === 0 ? (
                  <HomeIcon className="h-4 w-4" />
                ) : (
                  item.name
                )}
              </Link>
            )}
          </div>
        ))}
      </nav>
    </>
  );
}
