/** Rang varianti: shu rangning o'z rasmlari va o'z takliflari (python/sync/variants.py) */
export interface ProductVariant {
  /** Rang oilasi kaliti: "black", "blue"…; null — sarlavhada rang yozilmagan */
  color: string | null;
  images: string[];
  offers: Array<{ source: string; price: number; url: string }>;
  price: number | null;
}

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
  /** Faqat mahsulot sahifasi javobida */
  variants?: ProductVariant[];
  category: string;
  /** Brend kaliti nomdan (API: catalog._row_to_product) — /brand/<kalit> sahifasi */
  brand?: string | null;
  /** Ko'rinadigan brend nomi: "Samsung", "ZTE" */
  brandName?: string | null;
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
