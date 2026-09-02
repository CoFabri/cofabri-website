import * as React from 'react';
import { cn } from '@/lib/utils';

export function HairlineGrid({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('grid border-t border-l border-border', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function HairlineGridItem({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('border-r border-b border-border p-6 sm:p-8 bg-card transition-colors hover:bg-muted', className)}
      {...props}
    >
      {children}
    </div>
  );
}
