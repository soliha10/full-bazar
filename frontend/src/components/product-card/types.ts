export interface Product {
  id: string | number;
  /** Kanonik URL bo'lagi (/product/<slug>). Eski javoblarda bo'lmasligi mumkin. */
  slug?: string | null;
  name: string;
  title?: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  image: string;
  images?: string[];
  category: string;
  inStock: boolean;
  description?: string;
  source?: string;
  url?: string;
  markets?: Array<{
    source: string;
    price: number;
    url: string;
    /** Narx oxirgi marta tekshirilgan payt (ISO). Eski keshdan kelgan
     *  javoblarda bo'lmasligi mumkin, shuning uchun ixtiyoriy. */
    checkedAt?: string | null;
  }>;
  current_price?: number;
  current_markets?: Array<{
    source: string;
    price: number;
    url?: string;
  }>;
}
