import { Product } from '../components/ProductCard';
export function formatSum(amount: number): string {
  return Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " so'm";
}

/**
 * "3 soat oldin" ko'rinishidagi yozuv. Xalqaro agregatorlar har taklif yonida
 * narx qachon tekshirilganini ko'rsatadi — bu ro'yxatga ishonishning asosiy
 * sharti, chunki eskirgan narx foydalanuvchini do'konda kutilmagan summa bilan
 * qoldiradi.
 *
 * `null` qaytsa, hech narsa ko'rsatilmaydi: noma'lum vaqtni "hozir" deb
 * ko'rsatish yolg'on ishonch beradi.
 */
export function formatCheckedAt(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;

  const minutes = Math.floor((Date.now() - then) / 60000);
  if (minutes < 0)  return null;          // kelajakdagi sana — soat noto'g'ri
  if (minutes < 60) return 'hozirgina tekshirildi';

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} soat oldin tekshirildi`;

  const days = Math.floor(hours / 24);
  if (days === 1) return 'kecha tekshirildi';
  if (days < 30)  return `${days} kun oldin tekshirildi`;
  return 'bir oydan ko\'proq vaqt oldin tekshirildi';
}

export function resolveImageUrl(url: string | undefined | null): string {
  if (!url) return '';
  // Some OLX listings only exposed a placeholder asset path from the scraper
  // (a local filesystem path, not a real image URL) — treat it as missing.
  if (!url.startsWith('http') && !url.startsWith('/api/')) return '';
  if (url.includes('olxcdn.com')) {
    // Upgrade to higher quality and proxy to bypass hotlink protection
    const upgraded = url.replace(/;s=\d+x\d+;q=\d+/, ';s=644x461;q=80');
    return `/api/proxy-image?url=${encodeURIComponent(upgraded)}`;
  }
  return url;
}

function parseRating(actualRating?: any): number {
  if (actualRating === undefined || actualRating === null) return 0;
  const parsed = parseFloat(String(actualRating));
  return !isNaN(parsed) && parsed > 0 ? Math.min(5, Math.max(1, parsed)) : 0;
}

function parseReviewCount(actualReviews?: any): number {
  if (actualReviews === undefined || actualReviews === null) return 0;
  const parsed = parseInt(String(actualReviews), 10);
  return !isNaN(parsed) && parsed > 0 ? parsed : 0;
}

export function mapProduct(item: any): Product {
  const rawPrice = item.actual_price || item.price || '0';
  const price = typeof rawPrice === 'number' ? rawPrice : parseFloat(String(rawPrice).replace(/\s/g, '').replace(/[^\d.]/g, '')) || 0;
  const category = item.category || 'General';
  const normalizedCategory = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
  const rating = parseRating(item.rating);
  const reviews = parseReviewCount(item.reviews || item.review_count);

  return {
    id: item.id,
    slug: item.slug ?? null,
    name: item.name || item.title || item.product_name || 'Product',
    price: price,
    originalPrice: item.old_price ? parseFloat(String(item.old_price).replace(/\s/g, '').replace(/[^\d.]/g, '')) : undefined,
    category: normalizedCategory,
    image: resolveImageUrl(item.image),
    images: item.images && item.images.length > 0 ? item.images.map(resolveImageUrl) : [resolveImageUrl(item.image)],
    rating: rating,
    reviews: reviews,
    description: item.title || item.product_name,
    inStock: item.availability !== 'Out of Stock',
    markets: item.markets || [],
    source: item.source,
    url: item.url
  };
}
