import type { Product } from "../../components/ProductCard";
import { useLanguage } from "../../contexts/LanguageContext";
import { SEO, SITE_URL, type ProductSchema } from "../../components/SEO";
import { productPath } from "../../utils/slug";

export function DetailSeo({ product }: { product: Product }) {
  const { t, language } = useLanguage();

  const seoTitle = product 
    ? t.detailPage.seoTitle.replace('{{name}}', product.name)
    : t.detailPage.seoFallbackTitle;

  const seoDesc = product 
    ? t.detailPage.seoDescription.replace('{{name}}', product.name)
    : '';

  // Bir mahsulot bir necha do'konda sotiladi — Google'ga narx oralig'ini
  // AggregateOffer sifatida beramiz, bu qidiruvda "X so'mdan" ko'rinishini beradi.
  const marketPrices = (product?.markets ?? [])
    .map((m) => Number(m.price))
    .filter((p) => Number.isFinite(p) && p > 0);

  const schema: ProductSchema | undefined = product ? {
    name: product.name,
    image: product.image,
    description: product.description || product.name,
    price: product.price,
    currency: 'UZS',
    availability: product.inStock ? 'InStock' : 'OutOfStock',
    url: `${SITE_URL}${productPath(product)}`,
    ratingValue: product.rating > 0 ? product.rating : undefined,
    reviewCount: product.reviews > 0 ? product.reviews : undefined,
    brand: product.brandName || undefined,
    sku: String(product.id),
    images: product.images,
    sellers: (product.markets ?? []).filter(m => Number(m.price) > 0)
      .map(m => ({ name: m.source, price: Number(m.price), url: m.url })),
    offerCount: marketPrices.length,
    lowPrice: marketPrices.length ? Math.min(...marketPrices) : undefined,
    highPrice: marketPrices.length ? Math.max(...marketPrices) : undefined,
  } : undefined;

  const breadcrumbs = product ? [
    { name: t.nav.home, url: '/' },
    { name: t.listing.seoSmartphones, url: '/products' },
    ...(product.brand && product.brandName ? [{ name: product.brandName, url: `/brand/${product.brand}` }] : []),
    { name: product.name, url: productPath(product) },
  ] : undefined;

  return (
    <SEO
      title={seoTitle}
      description={seoDesc}
      keywords={t.detailPage.seoKeywords.replace('{{name}}', product?.name || '')}
      ogType="product"
      ogImage={product?.image}
      locale={language}
      canonicalUrl={product ? `${SITE_URL}${productPath(product)}` : undefined}
      breadcrumbs={breadcrumbs}
      productSchema={schema}
    />
  );
}
