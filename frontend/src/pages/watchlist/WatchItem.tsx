import { forwardRef } from 'react';
import { Trash2, TrendingDown, TrendingUp, ExternalLink, Minus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { formatSum } from '../../utils/productMapper';
import { trackStoreClick } from '../../services/tracking';
import { productPath } from '../../utils/slug';
import { useLanguage } from '../../contexts/LanguageContext';
import type { Product } from '../../components/ProductCard';
import { StoreLogo } from '../../components/StoreLogo';

/** Kuzatuvdagi bitta mahsulot: qo'shilgan paytdagi narx bilan hozirgi eng
 *  arzon narx taqqoslanadi (±1% dan katta farq — tushdi/oshdi).
 *  forwardRef shart: AnimatePresence mode="popLayout" chiqib ketayotgan
 *  elementni o'lchash uchun ref'ni to'g'ridan-to'g'ri DOM tuguniga beradi. */
export const WatchItem = forwardRef<HTMLDivElement, {
  product: Product;
  index: number;
  onRemove: (product: Product) => void;
}>(function WatchItem({ product, index: i, onRemove }, ref) {
  const { t } = useLanguage();
  const savedPrice = product.price;
  const currentMarkets = product.current_markets ?? product.markets ?? [];
  const sortedCurrentMarkets = [...currentMarkets].sort((a, b) => a.price - b.price);
  const currentBestPrice = product.current_price ?? sortedCurrentMarkets[0]?.price ?? savedPrice;
  const bestMarket = sortedCurrentMarkets[0];

  const priceDiff = currentBestPrice - savedPrice;
  const pricePct = savedPrice > 0 ? (priceDiff / savedPrice) * 100 : 0;
  const dropped = pricePct < -1;
  const rose    = pricePct > 1;

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      transition={{ duration: 0.3, delay: Math.min(i, 8) * 0.04 }}
      className="glass rounded-2xl overflow-hidden hover:border-violet-200/70 dark:hover:border-violet-800/50 transition-all"
    >
      {/* Price change banner */}
      {(dropped || rose) && (
        <div className={`px-3.5 py-1.5 flex items-center gap-2 text-[11px] font-semibold ${
          dropped
            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
            : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
        }`}>
          {dropped ? <TrendingDown className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
          {dropped
            ? t.watchlist.priceDropped.replace('{{pct}}', Math.abs(pricePct).toFixed(0)).replace('{{amount}}', formatSum(Math.abs(priceDiff)))
            : t.watchlist.priceRose.replace('{{pct}}', pricePct.toFixed(0))
          }
        </div>
      )}

      <div className="p-3.5 flex gap-3">
        {/* Image */}
        <Link to={productPath(product)} className="shrink-0">
          <div className="w-20 h-20 rounded-xl bg-gray-50 dark:bg-gray-800 overflow-hidden">
            <img
              src={product.image}
              alt={product.name}
              onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/200x200/f5f3ff/7c3aed?text=📱'; }}
              className="w-full h-full object-contain p-2"
            />
          </div>
        </Link>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-between gap-1">
          <Link to={productPath(product)}>
            <h3 className="text-[13px] font-bold text-gray-900 dark:text-white line-clamp-2 leading-snug">
              {product.name}
            </h3>
          </Link>

          {/* Prices */}
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-base font-semibold text-gray-900 dark:text-white">
              {formatSum(currentBestPrice)}
            </span>
            {Math.abs(priceDiff) > 1000 && (
              <span className="text-[11px] text-gray-400 line-through">
                {formatSum(savedPrice)}
              </span>
            )}
          </div>

          {/* Saved price label */}
          <div className="flex items-center gap-1">
            {dropped && (
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded-full">
                {t.watchlist.cheaperBy.replace('{{amount}}', formatSum(Math.abs(priceDiff)))}
              </span>
            )}
            {rose && (
              <span className="text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded-full">
                {t.watchlist.pricierBy.replace('{{amount}}', formatSum(priceDiff))}
              </span>
            )}
            {!dropped && !rose && (
              <span className="flex items-center gap-0.5 text-[10px] font-bold text-gray-400 bg-gray-50 dark:bg-gray-800 px-1.5 py-0.5 rounded-full">
                <Minus className="w-2.5 h-2.5" />
                {t.watchlist.priceUnchanged}
              </span>
            )}
          </div>

          {/* Best market + actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {bestMarket && (
                <>
                  <StoreLogo name={bestMarket.source} size="xs" />
                  <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium truncate max-w-[100px]">
                    {bestMarket.source}
                  </span>
                  {bestMarket.url && bestMarket.url !== '#' && (
                    <a
                      href={bestMarket.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => { e.stopPropagation(); trackStoreClick(product.id, bestMarket.source, bestMarket.price); }}
                      className="text-violet-500 hover:text-violet-700 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {sortedCurrentMarkets.length > 1 && (
                    <span className="text-[10px] text-gray-400">{t.watchlist.moreStores.replace('{{count}}', String(sortedCurrentMarkets.length - 1))}</span>
                  )}
                </>
              )}
            </div>
            <button
              onClick={() => onRemove(product)}
              className="flex items-center gap-1 text-[11px] font-bold text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-2 py-1 rounded-lg transition-all active:scale-90"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {t.watchlist.remove}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
});
