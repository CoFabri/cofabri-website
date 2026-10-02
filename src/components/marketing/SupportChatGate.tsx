'use client';

import { useSearchParams } from 'next/navigation';
import SupportChat from './SupportChat';

// Visible to everyone when NEXT_PUBLIC_CHAT_ENABLED is 'true'. Until then it
// shows only for ?chat=1, a soft launch (not access control: the real switch
// is CHAT_ENABLED on the API).
export default function SupportChatGate() {
  const searchParams = useSearchParams();
  const enabled = process.env.NEXT_PUBLIC_CHAT_ENABLED === 'true' || searchParams?.get('chat') === '1';
  return enabled ? <SupportChat /> : null;
}
