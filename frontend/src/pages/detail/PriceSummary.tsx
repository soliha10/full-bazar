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
 * Narx xulosasi: narx holati (past/odatiy/yuqori), eng arzon narx va shu do'konga
 * bitta asosiy tugma. Do'konlar soni va har do'kon narxi — ostidagi takliflarda,
 * narx o'zgarishi — narx tarixi grafigida; bu yerda takrorlanmaydi.
 */
export function PriceSummary({ product, stats, history }: {
  product: Product;
  stats: PriceStats;
  history: PricePoint[] | null;
}) {
  const { t } = useLanguage();
  const d = t.detailPage;
  const { sortedMarkets, bestPrice } = stats;
  const best = sortedMarkets[0];
  // Holat — narx tarixi grafigi bilan aynan bir hisob (90 kunlik odatiy oraliq)
  const typical = useMemo(
    () => (history?.length && sortedMarkets.length ? typicalRange(buildSeries(history, sortedMarkets, 90).rows) : null),
    [history, sortedMarkets],
  );
  const verdict = typical && VERDICT[typical.verdict];
  const verdictLabel = typical && { low: d.verdictLow, typical: d.verdictTypical, high: d.verdictHigh }[typical.verdict];

  return (
    <section className="glass rounded-2xl p-4">
      {verdict && verdictLabel && (
        <span className={`mb-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${verdict.tone}`}>
          <verdict.icon className="w-3.5 h-3.5" aria-hidden="true" />{verdictLabel}
        </span>
      )}
      <p className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white tabular-nums">
        {formatSum(bestPrice || product.price)}
      </p>

      {/* Mobilda shu tugma pastki yopishqoq panelda — takrorlanmaydi */}
      {best?.url && (
        <a href={best.url} target="_blank" rel="noopener noreferrer"
          onClick={() => trackStoreClick(product.id, best.source, best.price)}
          className="mt-3 hidden md:flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-700 transition-colors">
          {/* Qaysi do'konga o'tishi tugmaning o'zida yoziladi */}
          <StoreLogo name={best.source} size="xs" />{d.goToStore.replace('{{store}}', best.source)}
        </a>
      )}
    </section>
  );
}
