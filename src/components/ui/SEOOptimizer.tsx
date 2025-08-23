import Head from 'next/head';
import StructuredData from './StructuredData';

interface SEOOptimizerProps {
  title: string;
  description: string;
  keywords?: string[];
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product';
  twitterCard?: 'summary' | 'summary_large_image';
  structuredData?: any;
  noindex?: boolean;
  nofollow?: boolean;
}

export default function SEOOptimizer({
  title,
  description,
  keywords = [],
  canonical,
  ogImage = '/images/placeholder.jpg',
  ogType = 'website',
  twitterCard = 'summary_large_image',
  structuredData,
  noindex = false,
  nofollow = false
}: SEOOptimizerProps) {
  const fullTitle = title.includes('|') ? title : `${title} | CoFabri`;
  const fullCanonical = canonical ? `https://cofabri.com${canonical}` : 'https://cofabri.com';
  const fullOgImage = ogImage.startsWith('http') ? ogImage : `https://cofabri.com${ogImage}`;

  return (
    <>
      <Head>
        {/* Basic Meta Tags */}
        <title>{fullTitle}</title>
        <meta name="description" content={description} />
        {keywords.length > 0 && (
          <meta name="keywords" content={keywords.join(', ')} />
        )}
        
        {/* Canonical URL */}
        <link rel="canonical" href={fullCanonical} />
        
        {/* Robots Meta */}
        {noindex || nofollow ? (
          <meta name="robots" content={`${noindex ? 'noindex' : 'index'},${nofollow ? 'nofollow' : 'follow'}`} />
        ) : (
          <meta name="robots" content="index, follow" />
        )}
        
        {/* Open Graph Meta Tags */}
        <meta property="og:title" content={fullTitle} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content={ogType} />
        <meta property="og:url" content={fullCanonical} />
        <meta property="og:image" content={fullOgImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content="CoFabri" />
        <meta property="og:locale" content="en_US" />
        
        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content={twitterCard} />
        <meta name="twitter:title" content={fullTitle} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={fullOgImage} />
        <meta name="twitter:site" content="@cofabri" />
        <meta name="twitter:creator" content="@cofabri" />
        
        {/* Additional Meta Tags */}
        <meta name="author" content="CoFabri Team" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#3B82F6" />
        <meta name="msapplication-TileColor" content="#3B82F6" />
        
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* DNS Prefetch for external resources */}
        <link rel="dns-prefetch" href="//www.google-analytics.com" />
        <link rel="dns-prefetch" href="//www.googletagmanager.com" />
      </Head>
      
      {/* Structured Data */}
      {structuredData && (
        <StructuredData type={structuredData.type} data={structuredData.data} />
      )}
    </>
  );
}
