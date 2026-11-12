import type { Product } from "../../components/ProductCard";
import { useLanguage } from "../../contexts/LanguageContext";
import { formatSum } from "../../utils/productMapper";
import type { PriceStats } from "./priceStats";

/** Market overview — desktop: do'konlar soni, eng arzon/qimmat narx. */
export function MarketOverview({ product, stats }: { product: Product; stats: PriceStats }) {
  const { t } = useLanguage();
  const { bestPrice, sortedMarkets } = stats;

  return (
    <div className="hidden md:block rounded-2xl p-6 border border-gray-200 dark:border-gray-800">
      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-5">
        {t.detail.compareStores}
      </h3>
      <div className="grid grid-cols-2 gap-y-5 gap-x-8">
        {[
          { label: t.detail.specLabels.marketsCount, value: t.detailPage.itemsCount.replace('{{count}}', String(product.markets?.length || 1)) },
          { label: t.detail.specLabels.lowestPrice,  value: formatSum(bestPrice) },
          { label: t.detail.specLabels.highestPrice, value: formatSum(sortedMarkets[sortedMarkets.length - 1]?.price ?? bestPrice) },
          { label: t.detail.specLabels.bestStore,    value: product.source || '—' },
        ].map((spec, i) => (
          <div key={i}>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{spec.label}</p>
            <p className="font-medium text-gray-900 dark:text-white text-sm">{spec.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Narx tahlili — faqat shu mahsulotning haqiqiy narxlaridan.
 * Ilgari bu yerda "AI xulosa" bor edi: 4.8 / 4.9 / 4.7 kabi
 * baholar va matn har bir mahsulot uchun bir xil, qo'lda yozilgan edi.
 */
export function PriceInsight({ stats }: { stats: PriceStats }) {
  const { t } = useLanguage();
  const { sortedMarkets, bestPrice, worstPrice, savings, priceChange30 } = stats;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 md:p-6 border border-gray-200 dark:border-gray-800 space-y-4">
      <h3 className="text-base font-semibold text-gray-900 dark:text-white">
        {t.detailPage.priceInsight.title}
      </h3>
      <dl className="grid grid-cols-2 gap-3">
        {[
          { label: t.detailPage.priceInsight.cheapest, value: formatSum(bestPrice), sub: sortedMarkets[0]?.source },
          { label: t.detailPage.priceInsight.priciest, value: formatSum(worstPrice ?? bestPrice), sub: sortedMarkets[sortedMarkets.length - 1]?.source },
          { label: t.detailPage.priceInsight.gap, value: savings > 0 ? formatSum(savings) : '—', sub: savings > 0 ? `${Math.round((savings / (worstPrice || 1)) * 100)}%` : t.detailPage.priceInsight.singleStore },
          { label: t.detailPage.priceInsight.change30, value: priceChange30 == null ? '—' : `${priceChange30 > 0 ? '+' : ''}${priceChange30.toFixed(1)}%`, sub: priceChange30 == null ? t.detailPage.priceInsight.noHistory : priceChange30 < 0 ? t.detailPage.priceInsight.cheaper : priceChange30 > 0 ? t.detailPage.priceInsight.pricier : t.detailPage.priceInsight.same, tone: priceChange30 == null ? '' : priceChange30 < 0 ? 'text-emerald-600 dark:text-emerald-400' : priceChange30 > 0 ? 'text-red-500' : '' },
        ].map(item => (
          <div key={item.label} className="rounded-xl bg-gray-50 dark:bg-gray-800/50 px-3.5 py-3">
            <dt className="text-xs text-gray-500 dark:text-gray-400">{item.label}</dt>
            <dd className={`mt-1 text-base font-semibold text-gray-900 dark:text-white ${(item as { tone?: string }).tone ?? ''}`}>{item.value}</dd>
            {item.sub && <dd className="text-xs text-gray-500 dark:text-gray-400 truncate">{item.sub}</dd>}
          </div>
        ))}
      </dl>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {t.detailPage.priceInsight.storesCount.replace('{{count}}', String(sortedMarkets.length))}
      </p>
    </div>
  );
}
