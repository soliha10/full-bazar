import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import type { Product } from "../../components/ProductCard";
import { useLanguage } from "../../contexts/LanguageContext";
import { formatSum, formatCheckedAt } from "../../utils/productMapper";
import { trackStoreClick } from "../../services/tracking";
import type { PriceStats } from "./priceStats";

/** Desktop price table — barcha takliflar narx bo'yicha o'sish tartibida. */
export function OffersTable({ product, sortedMarkets, selectedMarketIndex, onSelect }: {
  product: Product;
  sortedMarkets: PriceStats['sortedMarkets'];
  selectedMarketIndex: number;
  onSelect: (index: number) => void;
}) {
  const { t } = useLanguage();

  return (
    <div className="hidden md:block overflow-hidden">
      <table className="w-full">
        <thead>
          <tr>
            <th className="text-left text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase pb-3">{t.detail.marketplace}</th>
            <th className="text-left text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase pb-3">{t.detail.availability}</th>
            <th className="text-left text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase pb-3">{t.detail.price}</th>
            <th className="pb-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
          {sortedMarkets.map((market, idx) => (
            <motion.tr
              key={idx}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.28, delay: idx * 0.06 }}
              onClick={() => onSelect(product.markets?.indexOf(market) ?? idx)}
              className={`cursor-pointer transition-colors ${
                selectedMarketIndex === product.markets?.indexOf(market)
                  ? 'bg-violet-50/50 dark:bg-violet-900/10'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
              }`}
            >
              <td className="py-3.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900 dark:text-white text-sm">{market.source}</span>
                  {/* sortedMarkets narx bo'yicha o'sish tartibida — birinchisi eng arzoni */}
                  {idx === 0 && sortedMarkets.length > 1 && (
                    <span className="shrink-0 px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-[9px] font-black uppercase tracking-wide">
                      {t.detailPage.cheapestBadge}
                    </span>
                  )}
                </div>
                {formatCheckedAt(market.checkedAt, t.checkedAt) && (
                  <div className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 mt-0.5">
                    {formatCheckedAt(market.checkedAt, t.checkedAt)}
                  </div>
                )}
              </td>
              <td className="py-3.5">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{t.detail.inStock}</span>
                </div>
              </td>
              <td className="py-3.5">
                <div className="font-black text-gray-900 dark:text-white text-sm">{formatSum(market.price)}</div>
                {/* Eng arzonidan qancha qimmatligi — agregatorlarda standart */}
                {idx > 0 && market.price > sortedMarkets[0].price && (
                  <div className="text-[11px] font-bold text-gray-400 dark:text-gray-500 mt-0.5">
                    +{formatSum(market.price - sortedMarkets[0].price)}
                  </div>
                )}
              </td>
              <td className="py-3.5 text-right">
                <a
                  href={market.url}
                  target="_blank"
                  onClick={e => { e.stopPropagation(); if (product) trackStoreClick(product.id, market.source, market.price); }}
                  className="inline-flex items-center gap-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-violet-600 hover:text-white hover:border-violet-600 transition-all"
                >
                  {t.detail.goToShop} <ExternalLink className="w-3 h-3" />
                </a>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
