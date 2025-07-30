'use client';

import { useEffect, useState } from 'react';

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const consentCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('analytics-consent='));
    
    // Only show banner if no consent decision has been made
    if (!consentCookie) {
      setShowBanner(true);
    }
  }, []);

  const acceptAnalytics = () => {
    document.cookie = 'analytics-consent=accepted; max-age=31536000; path=/; SameSite=Lax';
    setShowBanner(false);
    // Reload the page to trigger analytics loading
    window.location.reload();
  };

  const denyAnalytics = () => {
    document.cookie = 'analytics-consent=denied; max-age=31536000; path=/; SameSite=Lax';
    setShowBanner(false);
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 p-4">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1">
          <p className="text-sm text-gray-700 leading-relaxed">
            We use cookies and similar technologies to analyze site traffic and personalize content. 
            This helps us provide a better experience for you. 
            <span className="block mt-1">
              <button 
                onClick={() => window.open('/legal', '_blank')}
                className="text-blue-600 hover:text-blue-800 underline text-sm"
              >
                Learn more about our privacy policy
              </button>
            </span>
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button
            onClick={denyAnalytics}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
          >
            Decline
          </button>
          <button
            onClick={acceptAnalytics}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
} 