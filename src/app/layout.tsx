import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import SitewideBanner from "@/components/ui/SitewideBanner";
import MarketingPopupWrapper from "@/components/MarketingPopupWrapper";
import Analytics from "@/components/ui/Analytics";
import CookieConsent from "@/components/ui/CookieConsent";
import StructuredData from "@/components/ui/StructuredData";

// Force dynamic rendering for the entire app
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "CoFabri - SaaS Apps for Modern Businesses",
    template: "%s | CoFabri"
  },
  description: "Discover our suite of powerful SaaS applications designed to help your business grow and succeed. From productivity tools to AI-powered solutions, we build software that works.",
  keywords: [
    'SaaS', 
    'software development', 
    'AI', 
    'cloud solutions', 
    'business automation',
    'productivity tools',
    'business software',
    'web applications',
    'enterprise software',
    'digital transformation'
  ],
  authors: [{ name: 'CoFabri Team' }],
  creator: 'CoFabri',
  publisher: 'CoFabri',
  category: 'Technology',
  classification: 'Business Software',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/logo.png', type: 'image/png', sizes: '32x32' },
    ],
    apple: [
      { url: '/logo.png', type: 'image/png', sizes: '180x180' },
    ],
    shortcut: '/favicon.ico',
  },
  manifest: '/manifest.json',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://cofabri.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://cofabri.com',
    siteName: 'CoFabri',
    title: 'CoFabri - SaaS Apps for Real Business Needs',
    description: 'CoFabri builds innovative SaaS applications that solve real business challenges. Discover our suite of productivity tools and AI-powered solutions.',
    images: [
      {
        url: '/images/placeholder.jpg',
        width: 1200,
        height: 630,
        alt: 'CoFabri - SaaS Apps for Real Business Needs',
        type: 'image/jpeg',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CoFabri - SaaS Apps for Real Business Needs',
    description: 'CoFabri builds innovative SaaS applications that solve real business challenges.',
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
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
    yahoo: 'your-yahoo-verification-code',
  },
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
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/images/cofabri-favicon.png" type="image/png" sizes="32x32" />
        <link rel="apple-touch-icon" href="/images/cofabri-favicon.png" />
        <link rel="manifest" href="/manifest.json" />
        <Analytics />
      </head>
      <body className={inter.className}>
        <StructuredData 
          type="organization" 
          data={{
            "foundingDate": "2024",
            "industry": "Software Development",
            "numberOfEmployees": "10-50"
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
      </body>
    </html>
  );
}
