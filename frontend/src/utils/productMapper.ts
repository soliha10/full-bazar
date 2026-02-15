import { Product } from '../components/ProductCard';

// Category-specific images from Unsplash
export const CATEGORY_IMAGES: Record<string, string[]> = {
  Smartphones: [
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80',
    'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800&q=80',
    'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&q=80',
    'https://images.unsplash.com/photo-1567581935884-3349697112d3?w=800&q=80',
    'https://images.unsplash.com/photo-1523206489230-c012c64b2b48?w=800&q=80',
    'https://images.unsplash.com/photo-1533310266094-8898a03807dd?w=800&q=80',
    'https://images.unsplash.com/photo-1551817671-6438c39cf6a2?w=800&q=80',
    'https://images.unsplash.com/photo-1591337676887-a217a6970c8a?w=800&q=80',
  ],
  Products: [
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
    'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&q=80',
    'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&q=80',
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80',
    'https://images.unsplash.com/photo-1524678606370-a47ad25cb82a?w=800&q=80',
    'https://images.unsplash.com/photo-1585333120111-9fa668da9498?w=800&q=80',
  ],
  Electronics: [
    'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&q=80',
    'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&q=80',
    'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=800&q=80',
    'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80',
    'https://images.unsplash.com/photo-1544244015-0cd4b3ffc6b0?w=800&q=80',
    'https://images.unsplash.com/photo-1510213175752-ad0b1ec7009e?w=800&q=80',
  ],
  Fashion: [
    'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&q=80',
    'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&q=80',
    'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800&q=80',
    'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&q=80',
    'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80',
  ],
  Home: [
    'https://images.unsplash.com/photo-1583847268964-b28dc2f51ac9?w=800&q=80',
    'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800&q=80',
    'https://images.unsplash.com/photo-1517705008128-361805f42e8a?w=800&q=80',
    'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=800&q=80',
    'https://images.unsplash.com/photo-1513519247388-4a26d710965c?w=800&q=80',
  ],
  Grocery: [
    'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80',
    'https://images.unsplash.com/photo-1506484381205-f7945653044d?w=800&q=80',
    'https://images.unsplash.com/photo-1543168256-418811576931?w=800&q=80',
  ],
  Beauty: [
    'https://images.unsplash.com/photo-1596462502278-27bfdc4033c8?w=800&q=80',
    'https://images.unsplash.com/photo-1522335789203-aabd1fcbee52?w=800&q=80',
    'https://images.unsplash.com/photo-1570172619380-2826dc218f54?w=800&q=80',
  ],
  General: [
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
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
    image: item.image || getProductImage(normalizedCategory, item.id),
    rating: rating,
    reviews: reviews,
    description: item.title || item.product_name,
    inStock: item.availability !== 'Out of Stock',
    markets: item.markets || [],
    source: item.source,
    url: item.url
  };
}
