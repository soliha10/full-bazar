import { SITE_NAME, SITE_URL, type Breadcrumb, type ProductSchema } from './config';

/** Sahifaning JSON-LD @graph elementlari: non bo'laklari va mahsulot */
export function buildGraph(breadcrumbs?: Breadcrumb[], productSchema?: ProductSchema): Record<string, unknown>[] {
  const graph: Record<string, unknown>[] = [];

  if (breadcrumbs && breadcrumbs.length > 0) {
    graph.push({
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((crumb, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: crumb.name,
        item: crumb.url.startsWith('http') ? crumb.url : SITE_URL + crumb.url,
      })),
    });
  }

  if (productSchema) {
    const offer: Record<string, unknown> =
      productSchema.offerCount && productSchema.offerCount > 1
        ? {
            '@type': 'AggregateOffer',
            url: productSchema.url,
            priceCurrency: productSchema.currency,
            lowPrice: productSchema.lowPrice ?? productSchema.price,
            highPrice: productSchema.highPrice ?? productSchema.price,
            offerCount: productSchema.offerCount,
            availability:
              productSchema.availability === 'InStock'
                ? 'https://schema.org/InStock'
                : 'https://schema.org/OutOfStock',
          }
        : {
            '@type': 'Offer',
            url: productSchema.url,
            priceCurrency: productSchema.currency,
            price: productSchema.price,
            itemCondition: 'https://schema.org/NewCondition',
            availability:
              productSchema.availability === 'InStock'
                ? 'https://schema.org/InStock'
                : 'https://schema.org/OutOfStock',
          };

    const product: Record<string, unknown> = {
      '@type': 'Product',
      name: productSchema.name,
      image: productSchema.image,
      description: productSchema.description,
      brand: { '@type': 'Brand', name: productSchema.brand || SITE_NAME },
      offers: offer,
    };
    if (productSchema.sku) product.sku = productSchema.sku;
    if (productSchema.ratingValue && productSchema.reviewCount) {
      product.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: productSchema.ratingValue,
        reviewCount: productSchema.reviewCount,
        bestRating: 5,
        worstRating: 1,
      };
    }
    graph.push(product);
  }

  return graph;
}
