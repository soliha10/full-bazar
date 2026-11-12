// Tahlil sahifasi API javoblari turlari va do'kon ranglari.

export const API = import.meta.env.VITE_API_URL ?? '';

export interface SearchTrend { query: string; count: number; uniqueSessions: number }
export interface MarketStat {
  source: string; productCount: number;
  avgPrice: number; minPrice: number; maxPrice: number;
}
export interface PopularProduct { id: string; name: string; price: number; image: string | null; viewCount: number }
export interface PriceItem { id: string; name: string; price: number; priceChange: number; pctChange: number }

export const MARKET_COLORS = [
  '#7C3AED','#E31E24','#F97316','#10B981','#8B5CF6',
  '#F59E0B','#005BFF','#EF4444','#6D28D9','#EC4899',
  '#14B8A6','#374151','#DC2626','#059669','#2563EB',
];
