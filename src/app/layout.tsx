import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/marketing/Navbar";
import Footer from "@/components/marketing/Footer";
import SitewideBanner from "@/components/marketing/SitewideBanner";
import MarketingPopupWrapper from "@/components/MarketingPopupWrapper";
import Analytics from "@/components/marketing/Analytics";
import CookieConsent from "@/components/marketing/CookieConsent";
import StructuredData from "@/components/marketing/StructuredData";
import { ThemeProvider } from "@/components/theme-provider";

export const runtime = 'nodejs';

export const metadata: Metadata = {
  title: {
    default: "CoFabri - A Software Studio Building a Portfolio of Independent Apps",
    template: "%s | CoFabri"
  },
  description: "CoFabri builds and operates a portfolio of independent SaaS apps across industries, and partners with the industry operators who know those markets best to build new ones.",
  keywords: [
    'software studio',
    'SaaS studio',
    'venture studio',
    'co-build a SaaS product',
    'software development partnership',
    'equity partnership software',
    'build and operate SaaS',
    'CoFabri',
  ],
  authors: [{ name: 'CoFabri Team' }],
  creator: 'CoFabri',
  publisher: 'CoFabri',
  category: 'Technology',
  classification: 'Business Software',
  icons: {
    icon: [
      { url: 'https://files.cofabri.com/logos/cofabri-core/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: 'https://files.cofabri.com/logos/cofabri-core/icon-512.png', sizes: '512x512' },
    ],
    shortcut: 'https://files.cofabri.com/logos/cofabri-core/icon-512.png',
  },
  manifest: '/manifest.json',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://cofabri.com'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://cofabri.com',
    siteName: 'CoFabri',
    title: 'CoFabri - A Software Studio Building a Portfolio of Independent Apps',
    description: 'We build and operate a portfolio of independent SaaS apps across industries, and co-build new ones with the industry operators who know those markets best.',
    images: [
      {
        url: '/images/placeholder.jpg',
        width: 1200,
        height: 630,
        alt: 'CoFabri - A Software Studio Building a Portfolio of Independent Apps',
        type: 'image/jpeg',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CoFabri - A Software Studio Building a Portfolio of Independent Apps',
    description: 'We build and operate a portfolio of independent SaaS apps across industries, and co-build new ones with the industry operators who know those markets best.',
    images: ['/images/placeholder.jpg'],
    creator: '@cofabri',
    site: '@cofabri',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  // No `verification` block: the prior one shipped literal placeholder
  // strings ("your-google-verification-code") which render as a real,
  // wrong meta tag rather than failing loudly. Add this back with real
  // Search Console / Bing verification codes once you have them, or skip
  // it entirely if verification is done via DNS TXT record instead.
  other: {
    'msapplication-TileColor': '#3B82F6',
    'theme-color': '#3B82F6',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="https://files.cofabri.com/logos/cofabri-core/icon-512.png" sizes="any" />
        <link rel="apple-touch-icon" href="https://files.cofabri.com/logos/cofabri-core/icon-512.png" />
        <link rel="manifest" href="/manifest.json" />
        <Analytics />
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <StructuredData
            type="organization"
            data={{
              "industry": "Software Development"
            }}
          />
          <StructuredData
            type="website"
            data={{
              "inLanguage": "en-US",
              "copyrightYear": new Date().getFullYear()
            }}
          />
          <Navbar />
          <SitewideBanner />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
          <MarketingPopupWrapper />
          <CookieConsent />
        </ThemeProvider>
      </body>
    </html>
  );
}
