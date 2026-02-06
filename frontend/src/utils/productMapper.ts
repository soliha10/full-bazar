import { Product } from '../components/ProductCard';

// Category-specific images from Unsplash
export const CATEGORY_IMAGES: Record<string, string[]> = {
  Smartphones: [
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80',
    'https://images.unsplash.com/photo-1592286927505-c0d0e0d9e0e0?w=800&q=80',
    'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&q=80',
    'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=800&q=80',
  ],
  Electronics: [
    'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&q=80',
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
    'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&q=80',
  ],
  Fashion: [
    'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&q=80',
    'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&q=80',
  ],
  Home: [
    'https://images.unsplash.com/photo-1583847268964-b28dc2f51ac9?w=800&q=80',
    'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800&q=80',
  ],
  Grocery: [
    'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80',
  ],
  Beauty: [
    'https://images.unsplash.com/photo-1596462502278-27bfdc4033c8?w=800&q=80',
  ],
  General: [
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
  ]
};

export function formatSum(amount: number): string {
  return Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " so'm";
}

// Generate consistent but varied image based on product ID
function getProductImage(category: string, productId: string | number): string {
  const categoryImages = CATEGORY_IMAGES[category] || CATEGORY_IMAGES.General;
  const idHash = String(productId).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const imageIndex = idHash % categoryImages.length;
  return categoryImages[imageIndex];
}

// Generate realistic rating based on product name/id
function generateRating(productId: string | number, actualRating?: string): number {
  if (actualRating) {
    const parsed = parseFloat(actualRating);
    if (!isNaN(parsed) && parsed > 0) return Math.min(5, Math.max(1, parsed));
  }
  
  // Generate consistent rating based on ID (between 3.5 and 5.0)
  const idHash = String(productId).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const rating = 3.5 + (idHash % 16) / 10; // Range: 3.5 to 5.0
  return Math.round(rating * 10) / 10;
}

// Generate realistic review count based on rating
function generateReviewCount(rating: number, productId: string | number): number {
  const idHash = String(productId).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Higher rated products tend to have more reviews
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
    image: getProductImage(normalizedCategory, item.id),
    rating: rating,
    reviews: reviews,
    description: item.title || item.product_name,
    inStock: item.availability !== 'Out of Stock',
    markets: item.markets || [],
    source: item.source,
    url: item.url
  };
}
