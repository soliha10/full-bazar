import type { Product } from "../../components/ProductCard";
import type { PricePoint } from "./useProductDetail";
import { buildSeries } from "./priceHistorySeries";

/** Do'kon takliflaridan hosil bo'ladigan narx ko'rsatkichlari. */
export function computePriceStats(product: Product | null, selectedMarketIndex: number, priceHistory: PricePoint[]) {
  const selectedMarket = product?.markets?.[selectedMarketIndex];
  const sortedMarkets = product?.markets ? [...product.markets].sort((a, b) => a.price - b.price) : [];
  const bestPrice = sortedMarkets[0]?.price ?? product?.price ?? 0;
  const worstPrice = sortedMarkets[sortedMarkets.length - 1]?.price;
  const savings = worstPrice && worstPrice > bestPrice ? worstPrice - bestPrice : 0;
  // 30 kunlik o'zgarish — narx tarixi grafigi bilan AYNAN bir hisob
  // (priceHistorySeries.ts): 30 kun oldingi eng arzon narx va hozirgisi.
  // Ilgari faqat davr ichidagi birinchi yozuvlar olinardi va davrdan oldin
  // narxi o'rnatilgan do'kon (eng arzoni bo'lishi mumkin) hisobga kirmasdi —
  // grafik -0.3% desa, bu yer -6.3% derdi.
  const priceChange30 = priceHistory.length && sortedMarkets.length
    ? buildSeries(priceHistory, sortedMarkets, 30).summary.changePct
    : null;
  return { selectedMarket, sortedMarkets, bestPrice, worstPrice, savings, priceChange30 };
}

export type PriceStats = ReturnType<typeof computePriceStats>;
