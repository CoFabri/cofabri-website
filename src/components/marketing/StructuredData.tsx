import Script from 'next/script';

interface StructuredDataProps {
  type: 'organization' | 'website' | 'article' | 'breadcrumb';
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
          "description": "CoFabri — small software that does one thing well.",
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
          "image": data.image || "https://cofabri.com/images/placeholder.jpg",
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
