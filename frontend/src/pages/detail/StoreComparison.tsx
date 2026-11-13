import { useMemo } from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import { formatSum } from "../../utils/productMapper";
import { DivergingBars, type DivergingItem } from "../../components/charts/DivergingBars";
import type { PricePoint } from "./useProductDetail";
import { buildSeries } from "./priceHistorySeries";

const CHANGE_DAYS = 30;

/**
 * Do'konlarda narx qayerda tushdi/ko'tarildi — 30 kunlik o'zgarish, diverging (±).
 * Kim qanchaga qimmatligi takliflar jadvalida (+farq) bor — bu yerda takrorlanmaydi.
 * Faqat 2+ do'konda sotiladigan mahsulot uchun ma'noli.
 */
export function StoreComparison({ history, markets }: {
  history: PricePoint[] | null;
  markets: { source: string; price: number }[];
}) {
  const { t } = useLanguage();
  const d = t.detailPage;

  const changes = useMemo<{ items: DivergingItem[]; flat: string[] }>(() => {
    if (!history?.length) return { items: [], flat: [] };
    const { rows } = buildSeries(history, markets, CHANGE_DAYS);
    const last = rows[rows.length - 1];
    const items: DivergingItem[] = [];
    const flat: string[] = [];
    for (const m of markets) {
      // Davr ichidagi birinchi ma'lum narx (do'kon keyinroq qo'shilgan bo'lishi mumkin)
      const first = rows.find(r => r.stores[m.source] !== undefined)?.stores[m.source];
      const now = last?.stores[m.source];
      if (first === undefined || now === undefined) continue;
      const pct = ((now - first) / first) * 100;
      if (Math.abs(pct) < 0.05) { flat.push(m.source); continue; }
      items.push({
        id: m.source, label: m.source, logo: m.source, value: pct,
        valueText: `${pct > 0 ? '+' : '−'}${Math.abs(pct).toFixed(1)}%`,
        sub: `${formatSum(first)} → ${formatSum(now)}`,
      });
    }
    items.sort((a, b) => a.value - b.value);
    return { items, flat };
  }, [history, markets]);

  // O'zgarish bo'lmasa blok umuman chiqmaydi — "o'zgarish yo'q" kartasi joy egallardi
  if (markets.length < 2 || (history !== null && changes.items.length === 0)) return null;

  return (
    <section aria-labelledby="compare-title" className="glass rounded-2xl p-4 md:p-5">
      <h2 id="compare-title" className="text-base font-semibold text-gray-900 dark:text-white mb-0.5">{d.compareTitle}</h2>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{d.changeHint.replace('{{n}}', String(CHANGE_DAYS))}</p>

      {history === null ? (
        <div className="h-32 rounded-2xl bg-gray-900/5 dark:bg-white/5 animate-pulse" aria-hidden="true" />
      ) : (
        <>
          <DivergingBars items={changes.items} negLabel={d.cheaperLegend} posLabel={d.pricierLegend} stacked />
          {changes.flat.length > 0 && (
            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">{d.flatStores.replace('{{list}}', changes.flat.join(', '))}</p>
          )}
        </>
      )}
    </section>
  );
}
