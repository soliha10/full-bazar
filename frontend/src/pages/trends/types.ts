// Tahlil sahifasi API javoblari turlari.

export const API = import.meta.env.VITE_API_URL ?? '';

export interface SearchTrend { query: string; count: number; uniqueSessions: number }
export interface MarketStat {
  source: string; productCount: number;
  avgPrice: number; minPrice: number; maxPrice: number;
}
export interface PopularProduct { id: string; name: string; price: number; image: string | null; viewCount: number }
export interface PriceItem { id: string; name: string; price: number; oldPrice: number; priceChange: number; pctChange: number }
