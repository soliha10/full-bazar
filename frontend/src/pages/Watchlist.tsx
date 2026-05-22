import { Bell, Trash2, ArrowLeft, TrendingDown, ExternalLink } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { usePriceWatch } from '../hooks/usePriceWatch';
import { useAuth } from '../contexts/AuthContext';
import { formatSum } from '../utils/productMapper';

export function Watchlist() {
  const { watched, toggle } = usePriceWatch();
  const { user, openLogin } = useAuth();
  const navigate = useNavigate();

  // ── Not logged in ──────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 pb-28 flex flex-col">
        <div className="sticky top-0 z-40 bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center gap-3 md:hidden">
          <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 active:scale-90 transition-all">
            <ArrowLeft className="w-4 h-4 text-gray-700 dark:text-gray-300" />
          </button>
          <span className="text-base font-black text-gray-900 dark:text-white">Narx kuzatuvi</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-5">
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            className="w-20 h-20 rounded-3xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center"
          >
            <Bell className="w-10 h-10 text-violet-400" />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <h2 className="text-lg font-black text-gray-900 dark:text-white mb-1">Narx kuzatuviga kiring</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
              Mahsulotlarni kuzating va narxi tushganda ko'ring
            </p>
          </motion.div>
          <motion.button
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.17 }}
            onClick={openLogin}
            className="px-8 py-3 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-black text-sm shadow-md shadow-violet-500/25 active:scale-95 transition-all"
          >
            Kirish
          </motion.button>
        </div>
      </div>
    );
  }

  // ── Logged in ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-28">

      {/* Mobile header */}
      <div className="sticky top-0 z-40 bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800 px-4 py-3 md:hidden">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 active:scale-90 transition-all">
            <ArrowLeft className="w-4 h-4 text-gray-700 dark:text-gray-300" />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <Bell className="w-4 h-4 text-violet-600" />
            <span className="text-base font-black text-gray-900 dark:text-white">Narx kuzatuvi</span>
            {watched.length > 0 && (
              <span className="bg-violet-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                {watched.length}
              </span>
            )}
          </div>
          {watched.length > 0 && (
            <button
              onClick={() => watched.forEach(p => toggle(p))}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pt-4 md:pt-8">

        {/* Desktop header */}
        <div className="hidden md:flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center">
              <Bell className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white">Narx kuzatuvi</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">{watched.length} ta mahsulot kuzatilmoqda</p>
            </div>
          </div>
          {watched.length > 0 && (
            <button
              onClick={() => watched.forEach(p => toggle(p))}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Barchasini o'chirish
            </button>
          )}
        </div>

        {/* Info banner */}
        <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800/40 rounded-2xl px-4 py-3 mb-4 flex items-start gap-3">
          <Bell className="w-4 h-4 text-violet-500 mt-0.5 shrink-0" />
          <p className="text-xs text-violet-700 dark:text-violet-300 leading-relaxed">
            Mahsulot kartasidagi <strong>qo'ng'iroq tugmasi</strong> orqali qo'shiladi.
            Saqlab qo'ygan narxlar bilan joriy narxlarni taqqoslang.
          </p>
        </div>

        {/* Empty state */}
        <AnimatePresence>
          {watched.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }} transition={{ duration: 0.4 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <motion.div
                initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 20 }}
                className="w-20 h-20 rounded-3xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center mb-5"
              >
                <Bell className="w-10 h-10 text-gray-200 dark:text-gray-700" />
              </motion.div>
              <h2 className="text-lg font-black text-gray-900 dark:text-white mb-2">Kuzatuv ro'yxati bo'sh</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-xs">
                Mahsulot kartasidagi 🔔 tugmasini bosib kuzatuvga qo'shing
              </p>
              <Link
                to="/products"
                className="bg-violet-600 hover:bg-violet-700 text-white font-black text-sm px-6 py-3 rounded-2xl active:scale-95 transition-all"
              >
                Mahsulotlarni ko'rish
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Watched list — compact card layout */}
        {watched.length > 0 && (
          <div className="flex flex-col gap-3">
            <AnimatePresence mode="popLayout">
              {watched.map((product, i) => {
                const sortedMarkets = [...(product.markets ?? [])].sort((a, b) => a.price - b.price);
                const bestPrice  = sortedMarkets[0]?.price ?? product.price;
                const worstPrice = sortedMarkets[sortedMarkets.length - 1]?.price;
                const savings    = worstPrice && worstPrice > bestPrice ? worstPrice - bestPrice : 0;
                const bestMarket = sortedMarkets[0];

                return (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                    transition={{ duration: 0.3, delay: Math.min(i, 8) * 0.04 }}
                    className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-3.5 flex gap-3 hover:shadow-lg hover:shadow-violet-500/8 hover:border-violet-200/70 dark:hover:border-violet-800/50 transition-all"
                  >
                    {/* Image */}
                    <Link to={`/product/${product.id}`} className="shrink-0">
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
                      <Link to={`/product/${product.id}`}>
                        <h3 className="text-[13px] font-bold text-gray-900 dark:text-white line-clamp-2 leading-snug">
                          {product.name}
                        </h3>
                      </Link>

                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base font-black text-gray-900 dark:text-white">
                          {formatSum(bestPrice)}
                        </span>
                        {savings > 0 && (
                          <span className="flex items-center gap-0.5 text-[11px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                            <TrendingDown className="w-3 h-3" />
                            -{formatSum(savings)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          {bestMarket && (
                            <>
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                              <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium truncate max-w-[100px]">
                                {bestMarket.source}
                              </span>
                              {bestMarket.url && bestMarket.url !== '#' && (
                                <a
                                  href={bestMarket.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-violet-500 hover:text-violet-700 transition-colors"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </>
                          )}
                        </div>
                        <button
                          onClick={() => toggle(product)}
                          className="flex items-center gap-1 text-[11px] font-bold text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-2 py-1 rounded-lg transition-all active:scale-90"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Olib tashlash
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
