import { useLanguage } from "../../contexts/LanguageContext";
import { formatSum } from "../../utils/productMapper";
import type { PriceStats } from "./priceStats";

/**
 * Narx tahlili — faqat shu mahsulotning haqiqiy narxlaridan.
 * Ilgari bu yerda "AI xulosa" bor edi: 4.8 / 4.9 / 4.7 kabi
 * baholar va matn har bir mahsulot uchun bir xil, qo'lda yozilgan edi.
 */
export function PriceInsight({ stats }: { stats: PriceStats }) {
  const { t } = useLanguage();
  const { sortedMarkets, bestPrice, worstPrice, savings, priceChange30 } = stats;

  const items = [
    { label: t.detailPage.priceInsight.cheapest, value: formatSum(bestPrice), sub: sortedMarkets[0]?.source },
    { label: t.detailPage.priceInsight.priciest, value: formatSum(worstPrice ?? bestPrice), sub: sortedMarkets[sortedMarkets.length - 1]?.source },
    { label: t.detailPage.priceInsight.gap, value: savings > 0 ? formatSum(savings) : '—',
      sub: savings > 0 ? `${Math.round((savings / (worstPrice || 1)) * 100)}%` : t.detailPage.priceInsight.singleStore },
    { label: t.detailPage.priceInsight.change30,
      value: priceChange30 == null ? '—' : `${priceChange30 > 0 ? '+' : ''}${priceChange30.toFixed(1)}%`,
      sub: priceChange30 == null ? t.detailPage.priceInsight.noHistory
        : priceChange30 < 0 ? t.detailPage.priceInsight.cheaper
        : priceChange30 > 0 ? t.detailPage.priceInsight.pricier : t.detailPage.priceInsight.same,
      tone: priceChange30 == null ? '' : priceChange30 < 0 ? 'text-emerald-600 dark:text-emerald-400' : priceChange30 > 0 ? 'text-red-500' : '' },
  ];

  // Ixcham: 2×2 ko'rsatkich, ichki qutilarsiz — uzun summalar kesilmaydi
  return (
    <section className="glass rounded-2xl px-5 py-4">
      <div className="flex items-baseline justify-between gap-3 mb-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{t.detailPage.priceInsight.title}</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {t.detailPage.priceInsight.storesCount.replace('{{count}}', String(sortedMarkets.length))}
        </p>
      </div>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
        {items.map(item => (
          <div key={item.label} className="min-w-0">
            <dt className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400 truncate">{item.label}</dt>
            <dd className={`mt-0.5 text-sm font-semibold tabular-nums truncate ${item.tone || 'text-gray-900 dark:text-white'}`}>{item.value}</dd>
            {item.sub && <dd className="text-xs text-gray-500 dark:text-gray-400 truncate">{item.sub}</dd>}
          </div>
        ))}
      </dl>
    </section>
  );
}
