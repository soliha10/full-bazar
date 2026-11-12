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
    <div className="md:hidden">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{t.detail.compareStores}</h3>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {product.markets?.length} {t.detail.storesAvailable}
        </span>
      </div>
      {(showAllMarkets ? sortedMarkets : sortedMarkets.slice(0, 4)).map((market, idx) => (
        <div
          key={idx}
          className="flex items-center justify-between py-3 border-b last:border-b-0 border-gray-100 dark:border-gray-800"
        >
          <div className="flex items-center gap-3">
            <div>
              <span className={`text-sm block text-gray-900 dark:text-white ${idx === 0 ? 'font-medium' : ''}`}>
                {market.source}
              </span>
              {idx === 0 ? (
                <span className="text-xs text-emerald-600 dark:text-emerald-400">
                  {t.detailPage.cheapestBadge}
                </span>
              ) : (
                formatCheckedAt(market.checkedAt, t.checkedAt) && (
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {formatCheckedAt(market.checkedAt, t.checkedAt)}
                  </span>
                )
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <span className={`font-semibold text-sm tabular-nums text-gray-900 dark:text-white`}>
              {formatSum(market.price)}
            </span>
            <a
              href={market.url}
              target="_blank"
              onClick={() => { if (product) trackStoreClick(product.id, market.source, market.price); }}
              className="flex items-center border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white px-3 rounded-lg text-xs font-medium min-h-[36px] active:bg-violet-600 active:text-white active:border-violet-600 transition-colors"
            >
              {t.detail.shop}
            </a>
          </div>
        </div>
      ))}

      {/* Narxni solishtirish uchun BARCHA takliflar ko'rinishi kerak —
          yashirilgan taklif eng arzoni bo'lib chiqishi mumkin. */}
      {sortedMarkets.length > 4 && (
        <button
          onClick={onToggleShowAll}
          className="w-full text-center py-3 text-sm font-medium text-violet-600 dark:text-violet-400"
        >
          {showAllMarkets
            ? t.detailPage.showFewerStores
            : t.detailPage.showMoreStores.replace('{{count}}', String(sortedMarkets.length - 4))}
        </button>
      )}
    </div>
  );
}
