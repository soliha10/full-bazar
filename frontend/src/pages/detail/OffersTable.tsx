import { motion } from "framer-motion";
import type { Product } from "../../components/ProductCard";
import { useLanguage } from "../../contexts/LanguageContext";
import { formatSum, formatCheckedAt } from "../../utils/productMapper";
import { trackStoreClick } from "../../services/tracking";
import type { PriceStats } from "./priceStats";
import { StoreLogo } from '../../components/StoreLogo';

/** Desktop price table — takliflar narx bo'yicha o'sish tartibida.
 *  "Mavjudlik" ustuni yo'q: do'konlardan bunday ma'lumot kelmaydi — ilgari har
 *  qatorda qotirilgan "Sotuvda bor" yozuvi turardi. */
// Sukut bo'yicha shuncha do'kon: 12 ta qator blokni ekrandan uzun qilib yuborardi
export const OFFERS_VISIBLE = 5;

export function OffersTable({ product, sortedMarkets, selectedMarketIndex, onSelect, showAll, onToggleShowAll }: {
  product: Product;
  sortedMarkets: PriceStats['sortedMarkets'];
  selectedMarketIndex: number;
  onSelect: (index: number) => void;
  showAll: boolean;
  onToggleShowAll: () => void;
}) {
  const { t } = useLanguage();

  return (
    <div className="hidden md:block overflow-hidden">
      <table className="w-full">
        <thead>
          <tr>
            <th className="text-left text-xs font-normal text-gray-500 dark:text-gray-400 pb-3">{t.detail.marketplace}</th>
            <th className="text-left text-xs font-normal text-gray-500 dark:text-gray-400 pb-3">{t.detail.price}</th>
            <th className="pb-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {(showAll ? sortedMarkets : sortedMarkets.slice(0, OFFERS_VISIBLE)).map((market, idx) => (
            <motion.tr
              key={idx}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.28, delay: idx * 0.06 }}
              onClick={() => onSelect(product.markets?.indexOf(market) ?? idx)}
              className={`cursor-pointer transition-colors ${
                selectedMarketIndex === product.markets?.indexOf(market)
                  ? 'bg-gray-50 dark:bg-gray-800/40'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
              }`}
            >
              <td className="py-2.5">
                <div className="flex items-center gap-2.5">
                  <StoreLogo name={market.source} size="md" />
                  <span className="font-medium text-gray-900 dark:text-white text-sm">{market.source}</span>
                  {/* sortedMarkets narx bo'yicha o'sish tartibida — birinchisi eng arzoni */}
                  {idx === 0 && sortedMarkets.length > 1 && (
                    <span className="shrink-0 text-emerald-600 dark:text-emerald-400 text-xs">
                      {t.detailPage.cheapestBadge}
                    </span>
                  )}
                </div>
                {formatCheckedAt(market.checkedAt, t.checkedAt) && (
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {formatCheckedAt(market.checkedAt, t.checkedAt)}
                  </div>
                )}
              </td>
              <td className="py-2.5">
                <div className="font-semibold text-gray-900 dark:text-white text-sm tabular-nums">{formatSum(market.price)}</div>
                {/* Eng arzonidan qancha qimmatligi — agregatorlarda standart */}
                {idx > 0 && market.price > sortedMarkets[0].price && (
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    +{formatSum(market.price - sortedMarkets[0].price)}
                  </div>
                )}
              </td>
              <td className="py-2.5 text-right">
                <a
                  href={market.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => { e.stopPropagation(); if (product) trackStoreClick(product.id, market.source, market.price); }}
                  className="inline-flex items-center border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-violet-600 hover:text-white hover:border-violet-600 transition-colors"
                >
                  {t.detail.goToShop}
                </a>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
      {/* Narxni solishtirish uchun hamma taklif kerak bo'lishi mumkin — yashirilmaydi, yig'iladi */}
      {sortedMarkets.length > OFFERS_VISIBLE && (
        <button type="button" onClick={onToggleShowAll} aria-expanded={showAll}
          className="mt-2 w-full rounded-xl py-2.5 text-sm font-medium text-violet-600 dark:text-violet-400 hover:bg-violet-500/5 transition-colors">
          {showAll ? t.detailPage.showFewerStores
            : t.detailPage.showMoreStores.replace('{{count}}', String(sortedMarkets.length - OFFERS_VISIBLE))}
        </button>
      )}
    </div>
  );
}
