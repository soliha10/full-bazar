import { Product } from '../components/ProductCard';
export function formatSum(amount: number): string {
  return Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " so'm";
}

function generateRating(productId: string | number, actualRating?: string): number {
  if (actualRating) {
    const parsed = parseFloat(actualRating);
    if (!isNaN(parsed) && parsed > 0) return Math.min(5, Math.max(1, parsed));
  } 
  const idHash = String(productId).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const rating = 3.5 + (idHash % 16) / 10; 
  return Math.round(rating * 10) / 10;
}

function generateReviewCount(rating: number, productId: string | number): number {
  const idHash = String(productId).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const baseReviews = rating >= 4.5 ? 50 : rating >= 4.0 ? 30 : 15;
  const variance = idHash % 100;
  return baseReviews + variance;
}

export function mapProduct(item: any): Product {
  const rawPrice = item.actual_price || item.price || '0';
  const price = typeof rawPrice === 'number' ? rawPrice : parseFloat(String(rawPrice).replace(/\s/g, '').replace(/[^\d.]/g, '')) || 0;
  const category = item.category || 'General';
  const normalizedCategory = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
  const rating = generateRating(item.id, item.rating);
  const reviews = generateReviewCount(rating, item.id);

  return {
    id: item.id,
    name: item.name || item.title || item.product_name || 'Product',
    price: price,
    originalPrice: item.old_price ? parseFloat(String(item.old_price).replace(/\s/g, '').replace(/[^\d.]/g, '')) : undefined,
    category: normalizedCategory,
    image: item.image,
    images: item.images && item.images.length > 0 ? item.images : [item.image],
    rating: rating,
    reviews: reviews,
    description: item.title || item.product_name,
    inStock: item.availability !== 'Out of Stock',
    markets: item.markets || [],
    source: item.source,
    url: item.url
  };
}
