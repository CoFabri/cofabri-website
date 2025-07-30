'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';

export default function Analytics() {
  const [consent, setConsent] = useState<boolean | null>(null);

  useEffect(() => {
    // Check for existing consent cookie
    const consentCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('analytics-consent='));
    
    if (consentCookie) {
      const consentValue = consentCookie.split('=')[1];
      setConsent(consentValue === 'accepted');
    }
  }, []);

  // Only load analytics if consent is explicitly given
  if (consent !== true) {
    return null;
  }

  return (
    <>
      {/* Google Analytics 4 */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-65WM3H0FJ9"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-65WM3H0FJ9', {
            page_title: document.title,
            page_location: window.location.href,
          });
        `}
      </Script>

      {/* HotJar */}
      <Script id="hotjar" strategy="afterInteractive">
        {`
          (function(h,o,t,j,a,r){
            h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
            h._hjSettings={hjid:1234567,hjsv:6};
            a=o.getElementsByTagName('head')[0];
            r=o.createElement('script');r.async=1;
            r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
            a.appendChild(r);
          })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
        `}
      </Script>
    </>
  );
} 