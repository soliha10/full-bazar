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
    <div className="bg-white dark:bg-gray-900 rounded-2xl md:rounded-3xl p-5 md:p-7 border border-gray-100 dark:border-gray-800 shadow-sm space-y-5">
      {/* Best price display */}
      <div className="flex items-end justify-between gap-3">
        <div>
          <div>
          <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5">
            {t.detail.bestPriceMarket}: <span className="text-violet-600 dark:text-violet-400">{selectedMarket?.source}</span>
          </p>
          {/* <span className="text-emerald-600 font-black text-[10px] uppercase tracking-widest bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-full border border-emerald-100 dark:border-emerald-900/30 shrink-0 text-center">
            {t.detail.lowestPrice30Days}
          </span> */}

          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl md:text-4xl font-black text-violet-600 dark:text-violet-400 tracking-tighter">
              {formatSum(selectedMarket?.price || product.price)}
            </span>
            {product.originalPrice && (
              <span className="text-lg text-gray-300 dark:text-gray-600 line-through decoration-2">
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
