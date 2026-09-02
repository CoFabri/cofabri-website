import Script from 'next/script';

interface StructuredDataProps {
  type: 'organization' | 'website' | 'article' | 'breadcrumb' | 'softwareApplication' | 'faqPage' | 'itemList' | 'service';
  data: Record<string, unknown>;
}

export default function StructuredData({ type, data }: StructuredDataProps) {
  const getStructuredData = () => {
    switch (type) {
      case 'organization':
        return {
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "CoFabri",
          "url": "https://cofabri.com",
          "logo": "https://cofabri.com/logo.png",
          "description": "CoFabri is a software studio operating a portfolio of independent apps across industries.",
          "sameAs": [
            "https://twitter.com/cofabri",
            "https://linkedin.com/company/cofabri"
          ],
          "contactPoint": {
            "@type": "ContactPoint",
            "contactType": "customer service",
            "url": "https://cofabri.com/contact"
          },
          "address": {
            "@type": "PostalAddress",
            "addressCountry": "US"
          },
          ...data
        };
      
      case 'website':
        return {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "CoFabri",
          "url": "https://cofabri.com",
          "description": "CoFabri — we don't build platforms, we build answers.",
          "potentialAction": {
            "@type": "SearchAction",
            "target": "https://cofabri.com/knowledge-base?search={search_term_string}",
            "query-input": "required name=search_term_string"
          },
          ...data
        };
      
      case 'article':
        return {
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": data.title,
          "description": data.description,
          "image": data.image || "https://files.cofabri.com/logos/cofabri/cofabri-og-image.png",
          "author": {
            "@type": "Organization",
            "name": "CoFabri"
          },
          "publisher": {
            "@type": "Organization",
            "name": "CoFabri",
            "logo": {
              "@type": "ImageObject",
              "url": "https://cofabri.com/logo.png"
            }
          },
          "datePublished": data.datePublished,
          "dateModified": data.dateModified,
          "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": data.url
          },
          ...data
        };
      
      case 'breadcrumb':
        return {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": (data.items as { name: string; url: string }[]).map((item, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "name": item.name,
            "item": item.url
          }))
        };

      case 'softwareApplication':
        // Deliberately no `offers`/`aggregateRating` — this site doesn't hold
        // real pricing or review data for portfolio apps, and fabricating
        // either is exactly the kind of structured-data spam Google's
        // guidelines flag and can act on.
        return {
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": data.name,
          "description": data.description,
          "url": data.url,
          ...(data.image ? { "image": data.image } : {}),
          "applicationCategory": data.applicationCategory || "BusinessApplication",
          "operatingSystem": "Web",
        };

      case 'faqPage':
        return {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": (data.items as { question: string; answer: string }[]).map((item) => ({
            "@type": "Question",
            "name": item.question,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": item.answer,
            },
          })),
        };

      case 'itemList':
        return {
          "@context": "https://schema.org",
          "@type": "ItemList",
          "itemListElement": (data.items as { name: string; url: string }[]).map((item, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "name": item.name,
            "url": item.url,
          })),
        };

      case 'service':
        // Note: there is no Google rich-result type for a B2B partnership
        // pitch, so this doesn't earn a SERP enhancement the way breadcrumbs
        // or FAQs do — its value is describing what CoFabri actually offers
        // here (a service, not a product listing) to anything reading the
        // page's entity data, not a rich-snippet play.
        return {
          "@context": "https://schema.org",
          "@type": "Service",
          "name": data.name || "Co-Build Partnership Program",
          "description": data.description,
          "serviceType": data.serviceType || "SaaS co-build partnership",
          "provider": {
            "@type": "Organization",
            "name": "CoFabri",
            "url": "https://cofabri.com",
          },
          "audience": {
            "@type": "BusinessAudience",
            "audienceType": data.audienceType || "Industry operators with a customer base",
          },
          "areaServed": data.areaServed || "Worldwide",
        };

      default:
        return data;
    }
  };

  return (
    <Script
      id={`structured-data-${type}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(getStructuredData())
      }}
    />
  );
}
