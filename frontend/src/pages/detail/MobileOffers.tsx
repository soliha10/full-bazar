import { ExternalLink } from "lucide-react";
import type { Product } from "../../components/ProductCard";
import { useLanguage } from "../../contexts/LanguageContext";
import { formatSum, formatCheckedAt } from "../../utils/productMapper";
import { trackStoreClick } from "../../services/tracking";
import type { PriceStats } from "./priceStats";

/** Mobile market cards — birinchi 4 ta taklif, qolgani tugma orqali. */
export function MobileOffers({ product, sortedMarkets, showAllMarkets, onToggleShowAll }: {
  product: Product;
  sortedMarkets: PriceStats['sortedMarkets'];
  showAllMarkets: boolean;
  onToggleShowAll: () => void;
}) {
  const { t } = useLanguage();

  return (
    <div className="md:hidden space-y-2">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-black text-gray-900 dark:text-white text-sm">{t.detail.compareStores}</h3>
        <span className="text-xs font-bold text-violet-600 dark:text-violet-400">
          {product.markets?.length} {t.detail.storesAvailable}
        </span>
      </div>
      {(showAllMarkets ? sortedMarkets : sortedMarkets.slice(0, 4)).map((market, idx) => (
        <div
          key={idx}
          className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
            idx === 0
              ? 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800/50'
              : 'bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
              idx === 0
                ? 'bg-violet-600 text-white shadow-sm shadow-violet-500/25'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}>
              {market.source.substring(0, 1)}
            </div>
            <div>
              <span className={`font-bold text-sm block ${idx === 0 ? 'text-violet-700 dark:text-violet-300' : 'text-gray-900 dark:text-white'}`}>
                {market.source}
              </span>
              {idx === 0 ? (
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  ✓ {t.detailPage.cheapestBadge}
                </span>
              ) : (
                formatCheckedAt(market.checkedAt, t.checkedAt) && (
                  <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500">
                    {formatCheckedAt(market.checkedAt, t.checkedAt)}
                  </span>
                )
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <span className={`font-black text-sm ${idx === 0 ? 'text-violet-700 dark:text-violet-300' : 'text-gray-900 dark:text-white'}`}>
              {formatSum(market.price)}
            </span>
            <a
              href={market.url}
              target="_blank"
              onClick={() => { if (product) trackStoreClick(product.id, market.source, market.price); }}
              className="flex items-center gap-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white px-3 py-1.5 rounded-xl text-[11px] font-bold min-h-[36px] active:bg-violet-600 active:text-white active:border-violet-600 transition-colors"
            >
              {t.detail.shop} <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      ))}

      {/* Narxni solishtirish uchun BARCHA takliflar ko'rinishi kerak —
          yashirilgan taklif eng arzoni bo'lib chiqishi mumkin. */}
      {sortedMarkets.length > 4 && (
        <button
          onClick={onToggleShowAll}
          className="w-full text-center py-3 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-xs font-black text-violet-600 dark:text-violet-400 active:scale-[0.98] transition-transform"
        >
          {showAllMarkets
            ? t.detailPage.showFewerStores
            : t.detailPage.showMoreStores.replace('{{count}}', String(sortedMarkets.length - 4))}
        </button>
      )}
    </div>
  );
}
