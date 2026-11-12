import type { Product } from "../../components/ProductCard";
import { useLanguage } from "../../contexts/LanguageContext";
import { formatSum } from "../../utils/productMapper";
import type { PriceStats } from "./priceStats";
import { OffersTable } from "./OffersTable";
import { MobileOffers } from "./MobileOffers";

/** Price section: tanlangan do'kon narxi va barcha takliflar ro'yxati. */
export function PriceSection({ product, stats, selectedMarketIndex, onSelectMarket, showAllMarkets, onToggleShowAll }: {
  product: Product;
  stats: PriceStats;
  selectedMarketIndex: number;
  onSelectMarket: (index: number) => void;
  showAllMarkets: boolean;
  onToggleShowAll: () => void;
}) {
  const { t } = useLanguage();
  const { selectedMarket, sortedMarkets } = stats;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 md:p-6 border border-gray-200 dark:border-gray-800 space-y-5">
      {/* Best price display */}
      <div className="flex items-end justify-between gap-3">
        <div>
          <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            {t.detail.bestPriceMarket}: <span className="text-gray-900 dark:text-white">{selectedMarket?.source}</span>
          </p>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-semibold text-gray-900 dark:text-white tracking-tight">
              {formatSum(selectedMarket?.price || product.price)}
            </span>
            {product.originalPrice && (
              <span className="text-base text-gray-400 dark:text-gray-500 line-through">
                {formatSum(product.originalPrice)}
              </span>
            )}
          </div>
        </div>

      </div>

      <OffersTable product={product} sortedMarkets={sortedMarkets}
        selectedMarketIndex={selectedMarketIndex} onSelect={onSelectMarket} />

      <MobileOffers product={product} sortedMarkets={sortedMarkets}
        showAllMarkets={showAllMarkets} onToggleShowAll={onToggleShowAll} />
    </div>
  );
}
