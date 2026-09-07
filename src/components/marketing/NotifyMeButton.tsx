'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import NotifyMeModal from './NotifyMeModal';

interface NotifyMeButtonProps {
  apps: { id: string; name: string }[];
  defaultKind: 'updates' | 'incidents';
  label?: string;
}

export default function NotifyMeButton({ apps, defaultKind, label = 'Notify me' }: NotifyMeButtonProps) {
  const [open, setOpen] = useState(false);
  if (apps.length === 0) return null;
  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        {label}
      </Button>
      <NotifyMeModal open={open} onOpenChange={setOpen} apps={apps} defaultKind={defaultKind} />
    </>
  );
}
