import type { Product } from "../../components/ProductCard";
import type { PricePoint } from "./useProductDetail";

/** Do'kon takliflaridan hosil bo'ladigan narx ko'rsatkichlari. */
export function computePriceStats(product: Product | null, selectedMarketIndex: number, priceHistory: PricePoint[]) {
  const selectedMarket = product?.markets?.[selectedMarketIndex];
  const sortedMarkets = product?.markets ? [...product.markets].sort((a, b) => a.price - b.price) : [];
  const bestPrice = sortedMarkets[0]?.price ?? product?.price ?? 0;
  const worstPrice = sortedMarkets[sortedMarkets.length - 1]?.price;
  const savings = worstPrice && worstPrice > bestPrice ? worstPrice - bestPrice : 0;
  // 30 kun ichidagi o'zgarish: tarixdagi eng birinchi kunning eng arzon narxi
  // va hozirgi eng arzon narx. Tarix bo'lmasa — null (ko'rsatilmaydi).
  const priceChange30 = (() => {
    if (priceHistory.length === 0 || !bestPrice) return null;
    const firstDay = [...priceHistory].sort((a, b) => a.date.localeCompare(b.date))[0].date.slice(0, 10);
    const startMin = Math.min(...priceHistory.filter(h => h.date.slice(0, 10) === firstDay).map(h => h.price));
    return startMin > 0 ? ((bestPrice - startMin) / startMin) * 100 : null;
  })();
  return { selectedMarket, sortedMarkets, bestPrice, worstPrice, savings, priceChange30 };
}

export type PriceStats = ReturnType<typeof computePriceStats>;
