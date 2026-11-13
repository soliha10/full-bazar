import type { PricePoint } from "./useProductDetail";
import { buildSeries } from "./priceHistorySeries";

export interface StoreChange { pct: number; first: number; now: number }

/**
 * Har do'konda narx N kun ichida qanchaga o'zgargani: davrdagi birinchi ma'lum
 * narx (do'kon keyinroq qo'shilgan bo'lishi mumkin) va oxirgisi. Ma'lumot
 * bo'lmagan do'kon natijada yo'q. Takliflar ro'yxatidagi o'zgarish belgisi uchun.
 */
export function storeChanges(
  history: PricePoint[] | null,
  markets: { source: string; price: number }[],
  days: number,
): Record<string, StoreChange> {
  if (!history?.length) return {};
  const { rows } = buildSeries(history, markets, days);
  const last = rows[rows.length - 1];
  const out: Record<string, StoreChange> = {};
  for (const m of markets) {
    const first = rows.find(r => r.stores[m.source] !== undefined)?.stores[m.source];
    const now = last?.stores[m.source];
    if (first === undefined || now === undefined) continue;
    out[m.source] = { pct: ((now - first) / first) * 100, first, now };
  }
  return out;
}
