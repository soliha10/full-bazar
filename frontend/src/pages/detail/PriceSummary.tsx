import { useMemo } from "react";
import type { Product } from "../../components/ProductCard";
import { useLanguage } from "../../contexts/LanguageContext";
import { formatSum } from "../../utils/productMapper";
import { trackStoreClick } from "../../services/tracking";
import { StoreLogo } from "../../components/StoreLogo";
import type { PricePoint } from "./useProductDetail";
import type { PriceStats } from "./priceStats";
import { buildSeries, typicalRange } from "./priceHistorySeries";
import { VERDICT } from "./PriceHistoryChart";

/**
 * Narx xulosasi — narx solishtirish saytlarining (Idealo, PriceRunner, Google
 * Shopping) bosh bloki: "N do'konda X dan", narx holati (past/odatiy/yuqori),
 * oraliq va 30 kunlik o'zgarish, eng arzon do'konga bitta asosiy tugma.
 * Batafsil takliflar jadvali pastda, alohida bo'limda.
 */
export function PriceSummary({ product, stats, history }: {
  product: Product;
  stats: PriceStats;
  history: PricePoint[] | null;
}) {
  const { t } = useLanguage();
  const d = t.detailPage;
  const { sortedMarkets, bestPrice, worstPrice, priceChange30 } = stats;
  const best = sortedMarkets[0];
  // Holat — narx tarixi grafigi bilan aynan bir hisob (90 kunlik odatiy oraliq)
  const typical = useMemo(
    () => (history?.length && sortedMarkets.length ? typicalRange(buildSeries(history, sortedMarkets, 90).rows) : null),
    [history, sortedMarkets],
  );
  const verdict = typical && VERDICT[typical.verdict];
  const verdictLabel = typical && { low: d.verdictLow, typical: d.verdictTypical, high: d.verdictHigh }[typical.verdict];
  const changeTone = priceChange30 == null || Math.abs(priceChange30) < 0.05 ? 'text-gray-900 dark:text-white'
    : priceChange30 < 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400';

  return (
    <section className="glass rounded-2xl p-4 md:p-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          {verdict && verdictLabel && (
            <span className={`mb-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${verdict.tone}`}>
              <verdict.icon className="w-3.5 h-3.5" aria-hidden="true" />{verdictLabel}
            </span>
          )}
          <p className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white tabular-nums">
            {d.colorFrom.replace('{{price}}', formatSum(bestPrice || product.price))}
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {d.summaryStores.replace('{{count}}', String(sortedMarkets.length || 1))}
          </p>
        </div>
        {/* Mobilda shu tugma pastki yopishqoq panelda — takrorlanmaydi */}
        {best?.url && (
          <div className="hidden md:flex flex-col items-stretch gap-1.5">
            <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              {d.summaryBest}: <StoreLogo name={best.source} size="xs" />
              <span className="font-medium text-gray-900 dark:text-white">{best.source}</span>
            </span>
            <a href={best.url} target="_blank" rel="noopener noreferrer"
              onClick={() => trackStoreClick(product.id, best.source, best.price)}
              className="inline-flex justify-center rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-violet-700 transition-colors">
              {t.detail.goToShop}
            </a>
          </div>
        )}
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-gray-200 dark:border-gray-800 pt-3 text-sm">
        <div className="min-w-0">
          <dt className="text-xs text-gray-500 dark:text-gray-400">{d.summaryRange}</dt>
          <dd className="mt-0.5 font-medium tabular-nums text-gray-900 dark:text-white">
            {worstPrice && worstPrice > bestPrice
              ? <><span className="whitespace-nowrap">{formatSum(bestPrice)}</span> – <span className="whitespace-nowrap">{formatSum(worstPrice)}</span></>
              : formatSum(bestPrice)}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs text-gray-500 dark:text-gray-400">{d.summaryChange30}</dt>
          <dd className={`mt-0.5 font-medium tabular-nums ${changeTone}`}>
            {priceChange30 == null ? '—' : `${priceChange30 > 0 ? '+' : ''}${priceChange30.toFixed(1)}%`}
          </dd>
        </div>
      </dl>

    </section>
  );
}
