import { useEffect } from 'react';

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  canonicalUrl?: string;
  ogType?: 'website' | 'product';
  ogImage?: string;
  productSchema?: {
    name: string;
    image: string;
    description: string;
    price: number;
    currency: string;
    availability: string;
    url: string;
    ratingValue?: number;
    reviewCount?: number;
    brand?: string;
  };
}

export function SEO({
  title,
  description,
  keywords,
  canonicalUrl,
  ogType = 'website',
  ogImage = 'https://bazarcom.online/og-image.jpg',
  productSchema
}: SEOProps) {
  useEffect(() => {
    // 1. Update Title
    const fullTitle = `${title} | Bazarcom`;
    document.title = fullTitle;

    // Helper to update/create meta tag
    const updateMeta = (name: string, value: string, isProperty = false) => {
      const attr = isProperty ? 'property' : 'name';
      let element = document.head.querySelector(`meta[${attr}="${name}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attr, name);
        document.head.appendChild(element);
      }
      element.setAttribute('content', value);
    };

    // 2. Standard Meta tags
    updateMeta('description', description);
    if (keywords) {
      updateMeta('keywords', keywords);
    }
    updateMeta('robots', 'index, follow');

    // 3. OpenGraph tags
    updateMeta('og:title', fullTitle, true);
    updateMeta('og:description', description, true);
    updateMeta('og:image', ogImage, true);
    updateMeta('og:type', ogType, true);
    updateMeta('og:url', window.location.href, true);
    updateMeta('og:site_name', 'Bazarcom', true);

    // 4. Twitter cards
    updateMeta('twitter:card', 'summary_large_image');
    updateMeta('twitter:title', fullTitle);
    updateMeta('twitter:description', description);
    updateMeta('twitter:image', ogImage);

    // 5. Canonical Link
    const canonLink = canonicalUrl || window.location.href;
    let canonicalElement = document.head.querySelector('link[rel="canonical"]');
    if (!canonicalElement) {
      canonicalElement = document.createElement('link');
      canonicalElement.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalElement);
    }
    canonicalElement.setAttribute('href', canonLink);

    // 6. JSON-LD Structured Data
    let ldJsonScript = document.getElementById('ld-json-seo') as HTMLScriptElement;
    if (ldJsonScript) {
      ldJsonScript.remove();
    }

    if (productSchema) {
      ldJsonScript = document.createElement('script');
      ldJsonScript.id = 'ld-json-seo';
      ldJsonScript.type = 'application/ld+json';
      
      const schemaData: any = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        'name': productSchema.name,
        'image': productSchema.image,
        'description': productSchema.description,
        'brand': {
          '@type': 'Brand',
          'name': productSchema.brand || 'Bazarcom'
        },
        'offers': {
          '@type': 'Offer',
          'url': productSchema.url,
          'priceCurrency': productSchema.currency,
          'price': productSchema.price,
          'itemCondition': 'https://schema.org/NewCondition',
          'availability': productSchema.availability === 'InStock' 
            ? 'https://schema.org/InStock' 
            : 'https://schema.org/OutOfStock'
        }
      };

      if (productSchema.ratingValue && productSchema.reviewCount) {
        schemaData.aggregateRating = {
          '@type': 'AggregateRating',
          'ratingValue': productSchema.ratingValue,
          'reviewCount': productSchema.reviewCount
        };
      }

      ldJsonScript.textContent = JSON.stringify(schemaData);
      document.head.appendChild(ldJsonScript);
    }

    return () => {
      // Cleanup script on unmount
      const script = document.getElementById('ld-json-seo');
      if (script) script.remove();
    };
  }, [title, description, keywords, canonicalUrl, ogType, ogImage, productSchema]);

  return null;
}
