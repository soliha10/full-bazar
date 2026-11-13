import { useMemo, useState } from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import { formatSum } from "../../utils/productMapper";
import { DivergingBars, type DivergingItem } from "../../components/charts/DivergingBars";
import { PriceLadder } from "../../components/charts/PriceLadder";
import type { PricePoint } from "./useProductDetail";
import { buildSeries } from "./priceHistorySeries";

const CHANGE_DAYS = 30;

const seg = (on: boolean) => `px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
  on ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}`;

/**
 * Do'konlar taqqoslanishi — ikki savol, ikki grafik turi:
 *   · "Qaysi do'kon qanchaga qimmat?" — narx narvoni (progressive, bitta rang);
 *   · "Qayerda narx tushdi/ko'tarildi?" — 30 kunlik o'zgarish, diverging (±).
 * Faqat 2+ do'konda sotiladigan mahsulot uchun ma'noli.
 */
export function StoreComparison({ history, markets }: {
  history: PricePoint[] | null;
  markets: { source: string; price: number }[];
}) {
  const { t } = useLanguage();
  const d = t.detailPage;
  const [view, setView] = useState<'ladder' | 'change'>('ladder');

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

  if (markets.length < 2) return null;

  return (
    <section aria-labelledby="compare-title" className="mt-10 glass rounded-3xl p-5 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
        <h2 id="compare-title" className="text-lg font-semibold text-gray-900 dark:text-white">{d.compareTitle}</h2>
        <div role="group" className="flex rounded-xl bg-gray-900/5 dark:bg-white/5 p-1">
          <button type="button" aria-pressed={view === 'ladder'} onClick={() => setView('ladder')} className={seg(view === 'ladder')}>{d.ladderTab}</button>
          <button type="button" aria-pressed={view === 'change'} onClick={() => setView('change')} className={seg(view === 'change')}>
            {d.changeTab.replace('{{n}}', String(CHANGE_DAYS))}
          </button>
        </div>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
        {view === 'ladder' ? d.ladderHint : d.changeHint.replace('{{n}}', String(CHANGE_DAYS))}
      </p>

      {view === 'ladder' ? (
        <PriceLadder steps={markets} cheapestLabel={d.cheapestTag} />
      ) : history === null ? (
        <div className="h-48 rounded-2xl bg-gray-900/5 dark:bg-white/5 animate-pulse" aria-hidden="true" />
      ) : changes.items.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">{d.noStoreChanges}</p>
      ) : (
        <>
          <DivergingBars items={changes.items} negLabel={d.cheaperLegend} posLabel={d.pricierLegend} />
          {changes.flat.length > 0 && (
            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">{d.flatStores.replace('{{list}}', changes.flat.join(', '))}</p>
          )}
        </>
      )}
    </section>
  );
}
