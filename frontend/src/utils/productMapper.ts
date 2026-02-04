import { Product } from '../components/ProductCard';

export const CATEGORY_IMAGES: Record<string, string> = {
  Electronics: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?q=80&w=800',
  Fashion: 'https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=800',
  Home: 'https://images.unsplash.com/photo-1583847268964-b28dc2f51ac9?q=80&w=800',
  Grocery: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=800',
  Beauty: 'https://images.unsplash.com/photo-1596462502278-27bfdc4033c8?q=80&w=800',
  General: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=800',
  smartphones: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=800'
};


export function formatSum(amount: number): string {
  return Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " so'm";
}

export function mapProduct(item: any): Product {
  const rawPrice = item.actual_price || item.price || '0';
  const price = typeof rawPrice === 'number' ? rawPrice : parseFloat(String(rawPrice).replace(/\s/g, '').replace(/[^\d.]/g, '')) || 0;

  const category = item._category || item.category || 'General';
  const normalizedCategory = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();

  return {
    id: item.id,
    name: item.name || item.title || item.product_name || 'Product',
    price: price,
    category: normalizedCategory,
    image: CATEGORY_IMAGES[normalizedCategory] || CATEGORY_IMAGES[category] || CATEGORY_IMAGES.General,
    rating: parseFloat(item.rating) || 4.5,
    reviews: Math.floor(Math.random() * 50) + 5,
    description: item.title || item.product_name,
    inStock: item.availability !== 'Out of Stock',
    markets: item.markets || [],
    source: item.source,
    url: item.url
  };
}
