'use client';

import React, { useEffect } from 'react';

const LiveChat = () => {
  useEffect(() => {
    // Load HighLevel chat widget script
    const script = document.createElement('script');
    script.src = process.env.NEXT_PUBLIC_HIGHLEVEL_WIDGET_URL || '';
    script.async = true;
    script.type = 'text/javascript';
    document.head.appendChild(script);

    return () => {
      // Cleanup script on component unmount
      document.head.removeChild(script);
    };
  }, []);

  return (
    // HighLevel will inject its own chat widget UI
    <div id="highlevel-chat-widget"></div>
  );
};

export default LiveChat; 