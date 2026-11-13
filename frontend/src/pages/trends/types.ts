// Tahlil sahifasi API javoblari turlari.

export const API = import.meta.env.VITE_API_URL ?? '';

export interface SearchTrend { query: string; count: number; uniqueSessions: number }
export interface MarketStat {
  source: string; productCount: number;
  avgPrice: number; minPrice: number; maxPrice: number;
}
export interface PopularProduct { id: string; name: string; price: number; image: string | null; viewCount: number }
export interface PriceItem { id: string; name: string; price: number; oldPrice: number; priceChange: number; pctChange: number }

/** /api/stats — tahlil sahifasining bosh xulosasi uchun */
export interface TrendsStats {
  products: number; markets: number; offers: number;
  comparableProducts: number;
  /** Bir model do'konlar orasidagi narx farqi medianasi, 0..1 */
  medianPriceGap: number | null;
  lastUpdated: string | null;
}
