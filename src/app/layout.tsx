import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import SitewideBanner from "@/components/ui/SitewideBanner";
import MarketingPopupWrapper from "@/components/MarketingPopupWrapper";

// Force dynamic rendering for the entire app
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CoFabri - SaaS Apps for Modern Businesses",
  description: "Discover our suite of powerful SaaS applications designed to help your business grow and succeed.",
  keywords: ['SaaS', 'software development', 'AI', 'cloud solutions', 'business automation'],
  authors: [{ name: 'CoFabri Team' }],
  creator: 'CoFabri',
  publisher: 'CoFabri',
  icons: {
    icon: [
      { url: '/icon?<generated>', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon?<generated>', type: 'image/png' },
    ],
  },
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
    title: 'CoFabri - SaaS Apps for Real Business Needs',
    description: 'CoFabri builds innovative SaaS applications that solve real business challenges.',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'CoFabri - SaaS Apps for Real Business Needs',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CoFabri - SaaS Apps for Real Business Needs',
    description: 'CoFabri builds innovative SaaS applications that solve real business challenges.',
    images: ['/images/twitter-image.jpg'],
    creator: '@cofabri',
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
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Navbar />
        <SitewideBanner />
        <main className="flex-grow">
          {children}
        </main>
        <Footer />
        <MarketingPopupWrapper />
      </body>
    </html>
  );
}
