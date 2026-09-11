'use client';

import { useState } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import NotifyMeModal from './NotifyMeModal';

interface NotifyMeButtonProps {
  apps: { id: string; name: string }[];
  defaultKind: 'updates' | 'incidents';
  label?: string;
}

export default function NotifyMeButton({ apps, defaultKind, label = 'Notify Me' }: NotifyMeButtonProps) {
  const [open, setOpen] = useState(false);
  if (apps.length === 0) return null;
  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <BellIcon />
        {label}
      </Button>
      <NotifyMeModal open={open} onOpenChange={setOpen} apps={apps} defaultKind={defaultKind} />
    </>
  );
}
